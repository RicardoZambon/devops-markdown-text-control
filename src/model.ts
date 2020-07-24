export class Model {

    constructor(private _currentValue: string) {
    }

    public setCurrentValue(value: string) {
        if (value === undefined) {
            throw "Undefined value";
        }
        this._currentValue = value;
    }

    public getCurrentValue(): string {
        return this._currentValue;
    }
}