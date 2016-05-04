import {Component} from '@angular/core';
import {TogglerValueAccessor, Toggler} from "./components/toggler";

@Component({
  selector: 'seed-app',
  providers: [],
  pipes: [],
  directives: [TogglerValueAccessor, Toggler],
  templateUrl: 'app/seed-app.html',
})
export class SeedApp {

  model = true;
  constructor() {}

}
