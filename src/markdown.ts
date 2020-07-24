import * as MarkdownIt from "markdown-it";
import { WorkItemFormService } from 'TFS/WorkItemTracking/Services';

export class Markdown {
    private _md: MarkdownIt;
    private _func: Function;

    constructor(private script: string) {
        this._md = new MarkdownIt();

        if (script)
        {
            this._func = new Function('return ' + script)();
        }
    }

    private async processString(str: string): Promise<string> {
        if (!str) {
            return str;
        }
    
        const fieldValueRegex = /\${@fieldValue=\w[\w\s\d]*\w}/gi;
        const matches = str.match(fieldValueRegex);
        if (matches && matches.length > 0) {
            let returnStr = str;
            const fieldValues = await Promise.all(
                matches.map(async m => {
                    const fieldName = m
                        .replace("${@fieldValue=", "")
                        .replace("}", "")
                        .trim();

                    const fieldValue = await this.getFieldValue(fieldName)
                    
                    if (this._func) {
                        return this._func(fieldName, fieldValue);
                    } else {
                        return fieldValue;
                    }
                })
            );
    
            matches.forEach((m, i) => {
                const fieldValue = fieldValues[i] || "";
                returnStr = returnStr.replace(m, fieldValue.toString());
            });
    
            return returnStr;
        } else {
            return str;
        }
    }

    private async getFieldValue(fieldName: string): Promise<any> {
        const formService = await WorkItemFormService.getService();
        fieldName = fieldName.toLowerCase()

        if (fieldName == "id") {
            return formService.getId();
        }

        try {
            const fields = await formService.getFields();
            const field = fields.filter(x => x.name.toLowerCase() == fieldName)[0];

            if (field) {
                return await formService.getFieldValue(field.referenceName);
            } else {
                return null;
            }
        } catch {
            return null;
        }
    }

    public async markdown(markdown: string) : Promise<string> {
        const translatedText = await this.processString(markdown);
        return this._md.render(translatedText);
    }
}