import { Event, publisher, StreamSubscriptionHandler } from "@valkyr/ledger";

import { container } from "./Container";
import { jwt } from "./Jwt";
import { Cursor } from "./Models/Cursor";
import { append } from "./Subscriber";

/*
 |--------------------------------------------------------------------------------
 | Error
 |--------------------------------------------------------------------------------
 */

export class ApiErrorResponse extends Error {
  constructor(
    public readonly code: number,
    public readonly message: string,
    public readonly data: Record<string, unknown>
  ) {
    super(message);
  }
}

/*
 |--------------------------------------------------------------------------------
 | Streams
 |--------------------------------------------------------------------------------
 */

const streams: Record<string, StreamSubscriptionHandler> = {};

/*
 |--------------------------------------------------------------------------------
 | Remote
 |--------------------------------------------------------------------------------
 */

export const remote = new (class {
  public get url() {
    return container.get("Api");
  }

  public get socket() {
    return container.get("Socket");
  }

  // ### HTTP

  /**
   * Perform a post request against given resource.
   *
   * @param endpoint - API endpoint to call.
   * @param data     - Data to submit.
   *
   * @returns Response
   */
  async post<T = unknown>(endpoint: string, data: any): Promise<T> {
    return remote.send<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  /**
   * Perform a get request against given resource.
   *
   * @param endpoint - API endpoint to call.
   *
   * @returns Response
   */
  async get<T = unknown>(endpoint: string): Promise<T> {
    return remote.send<T>(endpoint, {
      method: "GET"
    });
  }

  /**
   * Perform a put request against given resource.
   *
   * @param endpoint - API endpoint to call.
   * @param data     - Data to submit.
   *
   * @returns Response
   */
  async put<T = unknown>(endpoint: string, data: any): Promise<T> {
    return remote.send<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  /**
   * Perform a delete request against given resource.
   *
   * @param endpoint - API endpoint to call.
   *
   * @returns Response
   */
  async delete<T = unknown>(endpoint: string): Promise<T> {
    return remote.send<T>(endpoint, {
      method: "DELETE"
    });
  }

  /**
   * Send http/s request to the api.
   *
   * @param endpoint - Endpoint to call.
   * @param init     - RequestInit
   *
   * @returns Response
   */
  async send<T = unknown>(endpoint: string, init: RequestInit = {}): Promise<T> {
    try {
      init.headers = {
        "Content-Type": "application/json",
        ...init.headers
      };
      if (jwt.token !== null) {
        (init.headers as any)["authorization"] = `Bearer ${jwt.token}`;
      }
      return await fetcher<T>(`${this.url}${endpoint}`, init);
    } catch (err) {
      throw new ApiErrorResponse(500, err.message, {});
    }
  }

  // ### EVENTS

  /**
   * Pull the events from the connected socket to ensure we are on the latest
   * central node version of the stream. This operation keeps repeating itself
   * until it pulls an empty event array signifying we are now up to date
   * with the central node.
   *
   * A simple iteration guard is added so that we can escape out of a potential
   * infinite loop.
   */
  public async pull(streamId: string, iterations = 0) {
    if (iterations > 10) {
      throw new Error(
        `Event Stream Violation: Escaping pull operation, infinite loop candidate detected after ${iterations} pull iterations.`
      );
    }

    const recorded = await Cursor.get(streamId);
    const url = `/ledger/${streamId}/pull` + (recorded ? `?recorded=${recorded}` : "");

    this.get<Event[]>(url).then(async (events) => {
      if (events.length > 0) {
        for (const event of events) {
          await append(event);
        }
        return this.pull(streamId, iterations + 1); // keep pulling the stream until its hydrated
      }
    });
  }

  public push(event: Event) {
    publisher.project(event, { hydrated: false, outdated: false });
    this.post("/ledger", { events: [event] });
  }

  // ### SOCKET

  public subscribe(streamId: string, handler: StreamSubscriptionHandler) {
    this.join(streamId);
    streams[streamId] = handler;
    this.pull(streamId);
  }

  public unsubscribe(streamId: string): void {
    this.leave(streamId);
  }

  public join(streamId: string) {
    this.socket.send("streams:join", { streamId });
  }

  public leave(streamId: string) {
    this.socket.send("streams:leave", { streamId });
  }
})();

/*
 |--------------------------------------------------------------------------------
 | Utilities
 |--------------------------------------------------------------------------------
 */

/**
 * Fetch wrapper that automatically handles the request and returns resulting JSON.
 *
 * @param input - RequestInfo.
 * @param init  - RequestInit.
 *
 * @returns Response
 */
export async function fetcher<T = unknown>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  const body = await response.text();
  if (body.length === 0) {
    return {} as T;
  }

  const data = JSON.parse(body);
  if (response.status >= 300) {
    throw new ApiErrorResponse(response.status, data.message, data.data ?? {});
  }
  return JSON.parse(body);
}
