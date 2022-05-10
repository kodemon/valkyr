import { Component, Injector, OnInit } from "@angular/core";
import { AuthService, DataSubscriber } from "@valkyr/angular";

@Component({
  selector: "navbar-profile",
  templateUrl: "./Template.html"
})
export class NavbarProfileComponent extends DataSubscriber implements OnInit {
  constructor(private auth: AuthService, injector: Injector) {
    super(injector);
  }

  public ngOnInit(): void {
    // ...
  }
}
