import {Inject, Directive, Component, forwardRef, Provider, OpaqueToken, EventEmitter} from "@angular/core";
import {NG_VALUE_ACCESSOR, ControlValueAccessor, NgControl} from "@angular/common";

// this is very cool feature of ng2 injectors which is completely not obvious
// we need to provide value accessor for ngModel and others so that they would be able to pick it up and use
// but we also want not to do it by hand
// so for this we use directive which will register such a provider in injector
// we could use two separate classes for directive and value accessor
// however sometimes we might need to bind some property of directive to something outside as input parameters or some settings
// and use it in value accessor
// in this case it would be convenient to merge them into one class
// but in this case we need to explicitly specify that directive object and our value accessor is in fact one object and not two
// here comes difference between useExisting and useClass
// with useExisting we specify that in order to provide something for token NG_VALUE_ACCESSOR
// injector must actually resolve TogglerValueAccessor token instead.
// so for both NG_VALUE_ACCESSOR token and TogglerValueAccessor token injector will resolve exactly the same object.
// in case of using useClass that would be two different objects and thus value accessor would not be able to access it.
export const TOGGLER_VALUE_ACCESSOR =
    new Provider(
        NG_VALUE_ACCESSOR,
        {
            useExisting: forwardRef(() => TogglerValueAccessor),
            multi: true
        }
    );

// just unique token
export const TOGGLE_EVENT = new OpaqueToken("TOGGLER_EVENTS");

// here we provide shared "toggled" event to inform value accessor that change has actually happened.
export const TOGGLE_EVENT_PROVIDER =
    new Provider(
        TOGGLE_EVENT,
        {
            useValue: new EventEmitter()
        }
    );

// directive which instantiates value accessor and event provider.
// value accessor should be exactly here because we want to provide it exactly on component level
// ngModel and others have @Self() decorator on NG_VALUE_ACCESSOR token injection
// this is ehy it cannot be moved say to component's provider or bootstrap providers
// it should be exactly on this injector node.
@Directive({
    selector: "toggler",
    providers: [TOGGLER_VALUE_ACCESSOR, TOGGLE_EVENT_PROVIDER]
})
export class TogglerValueAccessor implements ControlValueAccessor {

    private _onChange = (val: boolean) => {
    };
    private _onTouched = () => {
    };

    onChange = (val: boolean) => {
        this._onChange(val);
    };
    onTouched = () => {
        this._onTouched();
    };

    // injecting event
    constructor(@Inject(TOGGLE_EVENT) private event: EventEmitter<boolean>) {
        // and using it.
        // don't forget to unsubscribe in real application!
        event.subscribe((val: boolean) => {
            this.onChange(val);
            this.onTouched();
        });
    }

    // as you can see we don't even need to implement this function
    // just provide dummy method to make NgControl happy, that's all we need.
    writeValue(val: boolean): void {
    }

    registerOnChange(fn: any): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }

}

// main component
@Component({
    selector: "toggler",
    template: `<button class="btn btn-default" (click)="click()">{{(state ? "yes" : "no")}} - changed {{changeCount}} times</button>`
})
export class Toggler {

    state: boolean;

    changeCount = 0;

    constructor(@Inject(TOGGLE_EVENT) private event: EventEmitter<boolean>,
                @Inject(NgControl) ngControl: NgControl) {
        // I think this is an optimal way of binding to changes
        // another option is to declare @Input() parameter and use ngOnChanges implementation
        // but that way we already restricting how this component should be bound to outside world
        // this way on the contrary we bind to anything which implements NgControl abstract directive.
        // built-in are ngModel, ngControl and ngFormControl - all will work regardless of how they are combined
        // (they will decide themselves who will be in charge).
        // if control should work without even that we can add @Optional() decorator and add check if it was injected
        // and that's it.
        ngControl.control.valueChanges.subscribe((val: boolean) => {
            this.changeCount++;
            this.state = val;
        });
    }

    // pretty self-explanatory, I suppose :)
    click() {
        this.event.emit(!this.state);
    }

}
