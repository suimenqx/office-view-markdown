import {getEventName} from "../util/compatibility";
import {MenuItem} from "./MenuItem";

export class Help extends MenuItem {
    constructor(vditor: IVditor, menuItem: IMenuItem) {
        super(vditor, menuItem);

        const btn = this.element.children[0] as HTMLElement;
        btn.setAttribute("aria-label", "About");

        btn.addEventListener(getEventName(), (event) => {
            event.preventDefault();
            vditor.tip.show(`<div class="vditor-help-tip">
<strong>Office View Markdown</strong>
<span>A WYSIWYG Markdown editor for Visual Studio Code.</span>
</div>`, 0);
        });
    }
}
