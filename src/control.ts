/** The class control.ts will orchestrate the classes of InputParser, Model and View
 *  in order to perform the required actions of the extensions. 
 */

import * as WitService from "TFS/WorkItemTracking/Services";
import { Model } from "./model";
import { View } from "./view";
import { ErrorView } from "./errorView";
import * as Q from "q";

export class Controller {
    private _fieldName = "";
    private _markdown = "";
    private _script = "";

    private _inputs: IDictionaryStringTo<string>;
    private _model: Model;
    private _view: View;

    constructor() {
        this._initialize();
    }

    private _initialize(): void {
        this._inputs = VSS.getConfiguration().witInputs;
        this._fieldName = this._inputs["FieldName"];
        this._markdown = this._inputs["Markdown"];
        this._script = this._inputs["Script"];

        WitService.WorkItemFormService.getService().then(
            (service) => {
                Q.spread(
                    [service.getFieldValue(this._fieldName)],
                    (currentValue: string) => {
                        service.setFieldValue(this._fieldName, currentValue);
                        
                        // dependent on view, model, and inputParser refactoring
                        this._model = new Model(currentValue);
                        this._view = new View(this._model, this._script, (val) => {
                            this._updateInternal(val);
                        });
                        
                        //Force update markdown after view is created.
                        this._view.update(currentValue, this._markdown);

                    }, this._handleError
                ).then(null, this._handleError);
            },
            this._handleError);
    }

    private _handleError(error: string): void {
        new ErrorView(error);
    }

    private _updateInternal(value: string): void {
        WitService.WorkItemFormService.getService().then(
            (service) => {
                service.setFieldValue(this._fieldName, value).then(
                    () => {
                        this._update(value);
                    }, this._handleError);
            },
            this._handleError
        );
    }

    private _update(value: string): void {
        this._model.setCurrentValue(value);
        this._view.update(value, this._markdown);
    }

    public updateExternal(value: string): void {
        this._update(value);
    }

    public getFieldName(): string {
        return this._fieldName;
    }
}