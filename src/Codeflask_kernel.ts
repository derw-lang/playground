import CodeFlask from "codeflask";
import { generateDerw } from "derw/build/generators/derw";
import { generateElm } from "derw/build/generators/elm";
import { generateEnglish } from "derw/build/generators/english";
import { generateJavascript } from "derw/build/generators/js";
import { generateTypescript } from "derw/build/generators/ts";
import { parse } from "derw/build/parser";

export class CodeEditor extends HTMLElement {
    public container: any;
    public editor: any;
    public mode: any;
    constructor() {
        super();
        this.mode = "typescript";
        this.attachShadow({ mode: "open" });
        if (this.shadowRoot) {
            this.shadowRoot.innerHTML += `
<style>
    :host {
        display: block;
        position: relative;
        overflow-x: auto;
        width: 100%;
        height: 100%;
    }

    * {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        font-size: 20px !important;
    }
</style>`;
        }
    }

    connectedCallback() {
        this.id = this.getAttribute("id") || "code-flask";

        this.container = document.createElement("div");
        this.container.style.width = "100%";
        this.container.style.height = "100%";
        this.container.style.position = "absolute";

        if (this.shadowRoot) {
            this.shadowRoot.appendChild(this.container);
        }

        this.editor = new CodeFlask(this.container, {
            language: "derw",
            rtl: false,
            tabSize: 4,
            enableAutocorrect: false,
            lineNumbers: true,
            defaultTheme: true,
            readonly: this.hasAttribute("readonly"),
            styleParent: this.shadowRoot ? this.shadowRoot : undefined,
        });

        this.editor.addLanguage("derw", {
            comment: [
                {
                    pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
                    lookbehind: true,
                    greedy: true,
                },
            ],
            string: {
                pattern: /(["'`])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
                greedy: true,
            },
            keyword: /import|as|exposing|let|in|if|then|else|type|alias/,
            boolean: /\b(?: true | false) \b /,
            function: null,
            number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
            operator:
                /=|=>|\|>|>>|\+|-|\*|\/|%|\^|==|!=|>|>=|<|<=|&&|\|\||\+\+|::/,
            punctuation: /[{}[\];(),.:]/,
        });

        if (this.hasAttribute("value")) {
            this.editor.updateCode(this.getAttribute("value"));
        } else {
            this.setAttribute("value", "");
        }

        this.editor.onUpdate((code: string) => {
            if (this.getAttribute("value") !== code) {
                this.setAttribute("value", code);
                this.dispatchEvent(new Event("input"));

                if (this.id === "code-editor") {
                    this.renderCode(code);
                }
            }
        });
    }

    renderCode(code: string) {
        const parsed = parse(code, "Main");
        const output = document.getElementById("output");
        let generated = "";

        switch (this.mode) {
            case "javascript": {
                generated = generateJavascript(parsed);
                break;
            }
            case "typescript": {
                generated = generateTypescript(parsed);
                break;
            }
            case "elm": {
                generated = generateElm(parsed);
                break;
            }
            case "derw": {
                generated = generateDerw(parsed);
                break;
            }
            case "english": {
                console.log("parsed", parsed);
                generated = generateEnglish(parsed);
                break;
            }
        }

        if (output)
            (output as CodeEditor).setAttribute("language", "javascript");
        if (output) (output as CodeEditor).value = generated;
    }

    onModeUpdate() {
        this.renderCode(this.getAttribute("value") || "");
    }

    disconnectedCallback() {
        this.editor?.destroy();
    }

    get value(): string {
        return this.getAttribute("value") || "";
    }

    set value(code: string) {
        this.setAttribute("value", code);
        if (this.editor && this.editor.getCode() !== code) {
            this.editor.updateCode(code);
        }
    }
}

export function register(tag: any) {
    window.customElements.define(tag, CodeEditor);
}

export function newEditor(root: string): void {
    register("code-editor");
}

export function clearActive(): void {
    for (const elem of document.getElementsByClassName("active")) {
        elem.classList.toggle("active");
    }
}

export function setMode(mode: string) {
    const editor: any = document.getElementById("code-editor");
    if (editor) {
        editor.mode = mode;
        editor.onModeUpdate();
    }

    clearActive();
    switch (mode) {
        case "elm": {
            document.getElementById("view-elm")?.classList.toggle("active");
            break;
        }
        case "javascript": {
            document.getElementById("view-js")?.classList.toggle("active");
            break;
        }
        case "typescript": {
            document.getElementById("view-ts")?.classList.toggle("active");
            break;
        }
        case "derw": {
            document.getElementById("view-derw")?.classList.toggle("active");
            break;
        }
        case "english": {
            console.log("Switched mode to english");
            document.getElementById("view-english")?.classList.toggle("active");
            break;
        }
    }
}

declare global {
    interface Window {
        view: any;
    }
}
window.view = (value: string) => setMode(value);
