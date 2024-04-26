import {fabric} from "fabric"
import {groupBy, pick, uniqueId} from "lodash"
import {IExtendedTextBoxOptions} from "../Components/bulletscode";

const REGEX_VAR = new RegExp(/\`[\s*a-zA-Z0-9-_.@$!%,();:\/"|&']+?\`/g)

interface Param {
    id: string
    key: string
    startIndex: number
    endIndex: number
    name: string

}

const REF_TARGET = {
    NONE: "fill",
    NEON: "stroke",
    HOLLOW: "stroke",
    LIFT: "fill",
    SHADOW: "fill"
}

//@ts-ignore
fabric.Textbox.prototype.lineStyles = {};
//@ts-ignore
fabric.Textbox.prototype.bulletStyleMap = ["", "●", "■", "○", "◦", "•"];


fabric.Text.prototype.initDimensions = function() {
    if (this.__skipDimension) {
        return;
    }
    if(this.name === 'shapeText') return;
    this._splitText();
    this._clearCache();
    this.width = this.calcTextWidth() + (this._getLineLeftOffset(1) || this.cursorWidth);
    if (this.textAlign.indexOf("justify") !== -1) {
        this.enlargeSpaces();
    }
    this.height = this.calcTextHeight();
    this.saveState({
        propertySet: "_dimensionAffectingProps"
    });
};

export class StaticTextObject extends fabric.Textbox {
    static type = "StaticText"
    public fontURL: string = ""
    public params: Param[] = []
    public paramBounds: any[] = []
    public effect: any
    public light: any
    public lineStyles = {}
    public bulletStyle: number
    public bulletStyleMap =  ["", "●", "■", "○", "◦", "•"]
    public isBulletText: boolean
    public isNumberBullet: boolean

    private getParamsFromKeys(text: string): Param[] {
        let params: Param[] = []
        const matches = text.matchAll(REGEX_VAR)
        for (const match of matches) {
            const matchWord = match["0"]
            const startIndex = match["index"]
            params = params.concat({
                key: matchWord,
                startIndex: startIndex!,
                endIndex: startIndex! + matchWord.length,
                id: uniqueId(matchWord),
                name: matchWord
                    .slice(1, matchWord.length - 1)
                    .toLowerCase()
                    .split(" ")
                    .join("_")
            })
        }
        return params
    }

    private registerHoverEvent() {
        this.canvas!.on("mouse:move", e => {
            if (!this.isEditing && e.target === this) {
                const pointer = this.canvas!.getPointer(e.e, false)
                const key = this.paramBounds.find(key => {
                    if (
                        pointer.x >= key.left + this.left &&
                        pointer.x <= this.left + key.left + key.width &&
                        pointer.y >= key.top + this.top &&
                        pointer.y <= this.top + key.top + key.height
                    ) {
                        return true
                    } else {
                        return false
                    }
                })
                if (key) {
                    this.hoverCursor = "pointer"
                } else {
                    this.hoverCursor = "move"
                }
            }
        })
    }
    toggleBulletOnText(isNumber=false) {
        let obj = this;
        if (!obj.isBulletText && !obj.isNumberBullet && isNumber) {
            obj.isBulletText = true;
            obj.isNumberBullet = true;
        }
        else if(obj.isNumberBullet && isNumber){
            obj.isNumberBullet = false;
            obj.isBulletText = false;
        }
        else if(!obj.isNumberBullet && obj.isBulletText && isNumber){
            obj.isNumberBullet = true;
        }
        else if (!obj.isBulletText && !obj.isNumberBullet && !isNumber) {
            obj.isBulletText = true;
        }
        else if (obj.isNumberBullet && !isNumber) {
            obj.isBulletText = true;
            obj.isNumberBullet = false;
        }
        else if (obj.isBulletText  && !isNumber) {
            obj.isBulletText = false;
        }

        obj.initDimensions();
        this.canvas?.requestRenderAll();
        // this.canvas.fire("object:modified", { target: obj });

    };

    updateIndentLevel(){
        return this.textLines.map((line)=>({indentLevel:2}));
    }

    initialize(options:IExtendedTextBoxOptions) {
        const { text, params, styles,isBulletText,lineStyles, bulletStyle, bulletStyleMap,
            isNumberBullet, ...textOptions } = options
        this.params = params ? params : []
        this.paramBounds = []
        //@ts-ignore
        super.initialize(text, {
            ...textOptions, // @ts-ignore
            erasable: false
        })
        this.bulletStyle = bulletStyle || 1;
        this.objectCaching = false
        this.isBulletText = isBulletText || false
        this.isNumberBullet = isNumberBullet || false
        this.lineStyles = lineStyles || this.updateIndentLevel()
        this.styles = styles || {}

        if (styles && Array.isArray(styles)) {
            styles.forEach((style, i) => {
                const prevArrayLetters = text.split("").filter((t, i) => i <= style.start)
                let contPrevLineBreak = 0
                for (const t of prevArrayLetters) {
                    t === "\n" && contPrevLineBreak++
                }
                const currentArrayLetters = text.split("").filter((t, i) => i > style.start && i <= style.end && t)
                let contCurrentLineBreak = 0
                for (const t of currentArrayLetters) {
                    t === "\n" && contCurrentLineBreak++
                }
                this.setSelectionStyles(style.style, style.start + contPrevLineBreak, style.end + contCurrentLineBreak + contPrevLineBreak)
            })
        }
        this.on("added", () => {
            this.registerHoverEvent()
            this.updateParams()
        })
        this.on("editing:entered", () => {
            this.clearStyles()
            // this._initHiddenTextAreaEvents()
        })
        this.on("editing:exited", () => {
            this.updateParams()
            // this._removeHiddenTextAreaEvents()
        })

        this.on("modified", () => {
            this.updateParams()
        })
        this.on("changed", (e)=>this._onChangedText(e))
        return this
    }

    public _getBulletStyle(): number {
        // Function logic goes here
        return this.bulletStyle;
    }

    _onChangedText(e){

    }

    _initHiddenTextAreaEvents(){
        // Get the underlying HTML textarea element
        const textarea = this.hiddenTextarea;
        if (textarea) {
            textarea.addEventListener('keyup', this.handleKeyUp);
        }
    }

    _removeHiddenTextAreaEvents(){
        // Get the underlying HTML textarea element
        const textarea = this.hiddenTextarea;
        if (textarea) {
            textarea.removeEventListener('keyup', this.handleKeyUp);
        }
    }

    private handleKeyUp(e: KeyboardEvent) {
        e.preventDefault();
        // Perform actions when a key is released
        if (e.keyCode === 9) {
            // Tab key pressed
            var start = this.selectionStart;
            var end = this.selectionEnd;
            var text = this.text;

            // Insert tab space at the cursor position
            this.text = text.slice(0, start) + '\t' + text.slice(end);

            // Move the cursor forward by one position
            this.selectionStart = this.selectionEnd = start + 1;

            // Prevent the default tab behavior
            e.preventDefault();
            return false;
        }
        // Additional logic...
    }

    onKeyDown(e: KeyboardEvent) {
        if (this.isEditing && (e.keyCode === 8 || e.code === "Backspace")) {
            const textSelected = this.getSelectedText();
            const startIndex = this.selectionStart,
                endIndex = this.selectionEnd;
            let newLineStyles = {}, lineStyles = this.lineStyles;
            if (!textSelected){
                const {charIndex,lineIndex} = this.get2DCursorLocation(startIndex,true);
                if (charIndex === 0){ //if cursor is in first.
                    for (const key in lineStyles) {
                        const keyOut = parseInt(key)
                        if (lineIndex === keyOut) {
                            newLineStyles[keyOut] = lineStyles[keyOut + 1]
                            for (const key1 in lineStyles) {
                                const keyIn = parseInt(key1)
                                if (keyIn > keyOut){
                                    newLineStyles[keyIn] = lineStyles[keyIn + 1]
                                }
                            }
                            delete newLineStyles[Object.entries(newLineStyles).length - 1]
                            break;
                        }else newLineStyles[key] = lineStyles[key]
                    }
                    this.lineStyles = newLineStyles
                    this.dirty = true
                }
            }else {
                const startPosition = this.get2DCursorLocation(startIndex,true);
                const startLineIndex = startPosition.lineIndex;
                const endPosition = this.get2DCursorLocation(endIndex,true);
                const endLineIndex = endPosition.lineIndex;
                for (const key in lineStyles) {
                    const lineKey = parseInt(key);
                    if (lineKey >= startLineIndex + 1 && lineKey <= endLineIndex){
                        delete lineStyles[lineKey]
                        continue;
                    }
                    if (lineKey > endLineIndex) newLineStyles[Object.entries(newLineStyles).length] = lineStyles[lineKey]
                    else newLineStyles[lineKey] = lineStyles[lineKey]
                }
                this.lineStyles = newLineStyles
                this.dirty = true
            }
        }
        if (this.isEditing && (e.keyCode === 13 && e.code === "Enter")){


            // Get the current line index and the line's indent level
            const cursorLineIndexSkip = this.get2DCursorLocation(this.selectionStart)?.lineIndex;
            const cursorPosition = this.get2DCursorLocation(this.selectionStart,true);
            const currentLineIndex = cursorPosition.lineIndex;
            const currentIndentLevel = this.isLineIndent(cursorLineIndexSkip);
            const nextLineIndex = currentLineIndex + 1
            let oldLineIndentStyles = {...this.lineStyles}
            let newLineIndentStyles = {}
            for (const lineKey in oldLineIndentStyles) {
                const key = parseInt(lineKey);
                if (oldLineIndentStyles[key]) newLineIndentStyles[key] = oldLineIndentStyles[key]
                if (key === currentLineIndex && currentLineIndex === Object.entries(oldLineIndentStyles).length - 1){
                    // last line
                    newLineIndentStyles[currentLineIndex + 1] = oldLineIndentStyles[currentLineIndex]
                    break;
                }
                else if (key === nextLineIndex){
                    newLineIndentStyles[key] = {indentLevel: currentIndentLevel}
                    for (let i = nextLineIndex; i< Object.entries(oldLineIndentStyles).length; i++){
                        newLineIndentStyles[i + 1] = oldLineIndentStyles[i]
                    }
                    break;
                }
            }
            this.lineStyles = newLineIndentStyles;

            // Notify the canvas to re-render the textbox
            this.dirty = true;
            this.canvas?.requestRenderAll();

            this.initDimensions();

            // Notify the canvas to re-render the textbox
            this.dirty = true;
            this.canvas?.requestRenderAll();
        }
        if (this.isEditing && e.keyCode === 9 && !e.shiftKey) { // Check if Tab key is pressed during editing
            e.preventDefault(); // Prevent the default behavior of the Tab key

            // Get the current line index and the line's indent level
            const cursorPosition = this.get2DCursorLocation(this.selectionStart,true);
            const currentLineIndex = cursorPosition.lineIndex;
            const currentIndentLevel = this.isLineIndent(this.get2DCursorLocation(this.selectionStart)?.lineIndex);

            // Increase the indent level for the current line
            const newIndentLevel = currentIndentLevel + 1; // Increase the indent level as needed

            // Update the line's indent level in the lineStyles object
            this.lineStyles[currentLineIndex] = {indentLevel: newIndentLevel};

            // Notify the canvas to re-render the textbox
            this.dirty = true;
            this.canvas?.requestRenderAll();

            this.initDimensions();

            // Notify the canvas to re-render the textbox
            this.dirty = true;
            this.canvas?.requestRenderAll();

        }else if (this.isEditing && (e.shiftKey && e.keyCode === 9)) { // Check if Tab + shift key is pressed during editing
            e.preventDefault(); // Prevent the default behavior of the Tab key
            // Get the current line index and the line's indent level
            const cursorPosition = this.get2DCursorLocation(this.selectionStart,true);
            const currentLineIndex = cursorPosition.lineIndex;
            const currentIndentLevel = this.isLineIndent(this.get2DCursorLocation(this.selectionStart)?.lineIndex);

            // Increase the indent level for the current line
            const newIndentLevel = currentIndentLevel - 1; // Increase the indent level as needed

            if (newIndentLevel === 1) return; // means it is at first

            // Update the line's indent level in the lineStyles object
            this.lineStyles[currentLineIndex] = {indentLevel: newIndentLevel};

            // Notify the canvas to re-render the textbox
            this.dirty = true;
            this.canvas?.requestRenderAll();

            this.initDimensions();

            // Notify the canvas to re-render the textbox
            this.dirty = true;
            this.canvas?.requestRenderAll();

        } else {
            super.onKeyDown(e); // Handle other key events normally
        }
        this.canvas!.fire("object:modified", {target:this})
    }

    /**
     * Bullets adding
     * @param _line
     * @param lineIndex
     * @param desiredWidth
     * @private
     */

    _wrapLine (_line, lineIndex, desiredWidth) {
        var lineWidth = 0,
            graphemeLines = [],
            line = [],
            words = _line.split(this._reSpaceAndTab),
            word: string | string[] = "",
            offset = 0,
            infix = " ",
            wordWidth = 0,
            infixWidth = 0,
            largestWordWidth = 0,
            lineJustStarted = true,
            additionalSpace = this._getWidthOfCharSpacing();
        desiredWidth -= this.getIndentSpace(lineIndex);
        for (var i = 0; i < words.length; i++) {
            word = fabric.util.string.graphemeSplit(words[i]);
            wordWidth = this._measureWord(word, lineIndex, offset);
            offset += word.length;
            lineWidth += infixWidth + wordWidth - additionalSpace;
            if (lineWidth >= desiredWidth && !lineJustStarted) {
                graphemeLines.push(line);
                line = [];
                lineWidth = wordWidth;
                lineJustStarted = true;
            }
            if (!lineJustStarted) {
                line.push(infix);
            }
            line = line.concat(word);
            infixWidth = this._measureWord([infix], lineIndex, offset);
            offset++;
            lineJustStarted = false;
            if (wordWidth > largestWordWidth) {
                largestWordWidth = wordWidth;
            }
        }
        i && graphemeLines.push(line);
        if (largestWordWidth + this.getIndentSpace(lineIndex) > this.dynamicMinWidth) {
            this.dynamicMinWidth = largestWordWidth - additionalSpace+this.getIndentSpace(lineIndex);
        }
        return graphemeLines;

    };


    isLineIndent (line) {
        var lineIndex = this._styleMap && this._styleMap[line] ? this._styleMap[line].line : line;
        var lineStyles = this.lineStyles[lineIndex];
        return lineStyles?.indentLevel || 2
    };

    getIndentSpace (lineIndex) {
        if(this.isBulletText){
            return this.isLineIndent(lineIndex) * this.fontSize
        }else{
            return this.isLineIndent(lineIndex) * this.fontSize/3
        }
    };

    calcTextWidth () {
        var maxWidth = this.getLineWidth(0);
        for (var i = 1, len = this._textLines.length; i < len; i++) {
            var currentLineWidth = this.getLineWidth(i) + this.getIndentSpace(i);
            if (currentLineWidth > maxWidth) {
                maxWidth = currentLineWidth;
            }
        }
        return maxWidth;
    };

    getIndentStyle (e, t = undefined) {
        var n = !t && this._styleMap ? this._styleMap[e].line : e,
            r = this.lineStyles[n];
        return this.isNumberBullet ? "number" : (r ? r.indentStyle || "bullet" : "bullet");
    };
    private _parsedIntVal(value:any){
        let val = value
        if (typeof value === "string") val = parseInt(value)
        return val
    }
    private _getPrevItemsCount(currLineIndex,currIndentLevel:any,lineStyles){
        let count = 0;
        if (!currIndentLevel) return;
        const keys = Object.keys(lineStyles).slice(0,currLineIndex).reverse();
        for (let i = 0; i < keys?.length; i++) {
            const currentStyleInd = parseInt(keys[i])
            const currentStyleIndent = lineStyles[currentStyleInd].indentLevel
            if (currentStyleIndent + 1 === currIndentLevel) break;
            if (currentStyleIndent === currIndentLevel) count ++;
        }
        return count;
    }
    convertToRoman(num: number): string {
        const romanNumerals: { [key: string]: number } = {
            m: 1000,
            cm: 900,
            d: 500,
            cd: 400,
            c: 100,
            xc: 90,
            l: 50,
            xl: 40,
            x: 10,
            ix: 9,
            v: 5,
            iv: 4,
            i: 1,
        };

        let result = "";

        for (let key in romanNumerals) {
            while (num >= romanNumerals[key]) {
                result += key;
                num -= romanNumerals[key];
            }
        }

        return result;
    }
    convertToApha(num: number): string {
        const englishAlphabets: string[] = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
            'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
            'u', 'v', 'w', 'x', 'y', 'z'
        ];

        let result = "";

        while (num > 0) {
            const index = (num - 1) % 26;
            result = englishAlphabets[index] + result;
            num = Math.floor((num - 1) / 26);
        }

        return result;
    }
    // getUpdatedLineIndex (lineIndex) {
    //     const textLines = this.textLines;
    //     let newLineStyles = {}
    //     for (let i = 0; i < textLines.length; i++) {
    //         newLineStyles[i] =
    //     }
    //     const currentLine = textLines[lineIndex];
    //     const unwrappedLines = this._unwrappedTextLines.map(t=>t.join(''));
    //
    //     return unwrappedLines.findIndex(l=>l.includes(currentLine));
    // };
    _getNumberBullet(lineIndex: number){
        let lineStyles = {...this.lineStyles}
        if (!lineIndex) return "1"
        let currentLineIndentLevel,prevItemsCount = 0;
        let bulletNumberText:any = ""
        currentLineIndentLevel = lineStyles[lineIndex]?.indentLevel
        prevItemsCount = this._getPrevItemsCount(lineIndex, currentLineIndentLevel, lineStyles)
        if ([2,5,8,11].includes(currentLineIndentLevel)) {
            bulletNumberText = `${this._parsedIntVal(prevItemsCount) + 1}`
        }
        if ([3,6,9,12].includes(currentLineIndentLevel)) {
            bulletNumberText = `${this.convertToApha((this._parsedIntVal(prevItemsCount) || 0) + 1)}`
        }
        if ([4,7,10,13].includes(currentLineIndentLevel)) {
            bulletNumberText = `${this.convertToRoman((this._parsedIntVal(prevItemsCount) || 0) + 1)}`
        }
        return bulletNumberText;
    }

    getUpdatedLineIndex(lineIndex){
        const textLines = this.getUpdatedTextLines()
        const currLine = textLines?.find(t=>t.lineIndex === lineIndex)
        return currLine?.textStyleGroupIndex || lineIndex
    }

    getLineBulletText (lineIndex) {
        const styleInd = this.bulletStyle;
        if (!styleInd) return {text:""};
        const newIndex = this.getUpdatedLineIndex(lineIndex)
        if (newIndex === -1) return {text:""};
        const currStyle= this.styles[lineIndex]
        const newFontSize= currStyle ? currStyle[0]?.fontSize : this.fontSize
        const style = this.getIndentStyle(newIndex);
        if (0 !== lineIndex && !(this._styleMap) || !(this._styleMap) || this._styleMap[lineIndex].line === this._styleMap[lineIndex - 1].line) return {text:""};
        switch (style) {
            case "number":
                return {text:this._getNumberBullet(newIndex),newFontSize}
            case "bullet":
                if(this.isBulletText){
                    return {text:this.bulletStyleMap[styleInd],newFontSize}
                }else{
                    return {text:this.bulletStyleMap[0],newFontSize}
                }
            default:
                return {text:""}
        }
    };



    _getLineLeftOffset (lineIndex) {
        var indentSpace = this.getIndentSpace(lineIndex), lineWidth = this.getLineWidth(lineIndex) + indentSpace;
        return "center" === this.textAlign ? (this.width - lineWidth) / 2 + indentSpace : "right" === this.textAlign ? this.width - lineWidth + indentSpace : indentSpace
    };


    _renderTextLine (method, ctx, line, left, top, lineIndex) {
        //@ts-ignore


        this.callSuper("_renderTextLine", method, ctx, line, left, top, lineIndex);
        if(this.name === 'shapeText') return;
        const { text } = this.getLineBulletText(lineIndex);
        if (text) {
            top -= this.fontSize * this._fontSizeFraction;
            left = this.isBulletText ? left - (this.fontSize * 1.5) : left ;
            this._renderChar(method, ctx, lineIndex, 0, this.isNumberBullet ? text + "." : text, left, top);
        }
    };


    handleMouseUp(e: fabric.IEvent<Event>) {
        if (!this.isEditing && this.canvas) {
            const pointer = this.canvas!.getPointer(e.e, false)
            const param = this.paramBounds.find(param => {
                if (
                    pointer.x >= param.left + this.left &&
                    pointer.x <= this.left + param.left + param.width &&
                    pointer.y >= param.top + this.top &&
                    pointer.y <= this.top + param.top + param.height
                ) {
                    return true
                } else {
                    return false
                }
            })
            if (param) {
                const zoom = this.canvas!.getZoom()
                const {scaleX, scaleY, width, height} = this
                const {left, top} = this.getBoundingRect(false)
                const padLeft = (width! * scaleX! * zoom - width!) / 2
                const padTop = (height! * scaleY! * zoom - height!) / 2

                const eventData = {
                    object: this,
                    position: {
                        left: left + padLeft + param.width * zoom + param.left,
                        top: top + padTop + param.height * zoom + param.top
                    },
                    param
                }
                this.canvas!.fire("param:selected", eventData)
            }
        }
    }

    updateParam(key: string, name: string) {
        this.params = this.params.map(p => {
            if (p.key === key) {
                return {
                    ...p,
                    name
                }
            }
            return p
        })
        this.updateParams()
    }

    setParams() {
        const params = this.getParamsFromKeys(this.text!)

        if (this.params) {
            const updatedParams = params.map(param => {
                const existingParam = this.params.find(p => p.key === param.key)
                if (existingParam) {
                    return {
                        ...param,
                        name: existingParam.name
                    }
                }
                return param
            })
            this.params = updatedParams
        } else {
            this.params = params
        }
        this.params.forEach(param => {
            this.setSelectionStyles(
                {
                    textBackgroundColor: "#dcdde1",
                    key: param.key,
                    id: param.id,
                    name: param.name
                },
                param.startIndex,
                param.endIndex
            )
        })
    }

    setParamBounds() {
        setTimeout(() => {
            let textLines = this.getUpdatedTextLines()
            let paramBounds: any[] = []
            textLines.forEach(textLine => {
                const lineHeight = this.__lineHeights[parseInt(textLine.textStyleGroupIndex)]
                const params = this.getKeysFromTextStyles(textLine.lineStyles)
                const linekeyBounds = params.map(param => {
                    const charBounds = this.__charBounds![textLine.lineIndex].map(cbs => ({
                        ...cbs,
                        top: lineHeight * textLine.lineIndex
                    }))
                    const charBoundMin = charBounds[param.startIndex - textLine.startIndex]
                    const charBoundMax = charBounds[param.endIndex - 1 - textLine.startIndex]
                    if (!charBoundMin || !charBoundMax) {
                        return {}
                    }
                    const lineWidth = this.__lineWidths[textLine.lineIndex]
                    const width = this.width!
                    let shift = 0
                    if (this.textAlign === "center") {
                        shift = (width - lineWidth) / 2
                    } else if (this.textAlign === "right") {
                        shift = width - lineWidth
                    }
                    const charBound = {
                        ...charBoundMin,
                        ...param,
                        shift,
                        left: shift + charBoundMin.left,
                        top: charBoundMin.top,
                        width: charBoundMax.width + charBoundMax.left - charBoundMin.left,
                        height: charBoundMin.height
                    }
                    return charBound
                })
                paramBounds = paramBounds.concat(linekeyBounds)
            })
            this.paramBounds = paramBounds
        }, 250)
    }

    getKeysFromTextStyles(textSyles: any) {
        let charStyles: any[] = []
        let params: any[] = []
        Object.keys(textSyles).forEach(style => {
            if (textSyles[style].key) {
                charStyles = charStyles.concat({
                    index: parseInt(style),
                    key: textSyles[style].key,
                    id: textSyles[style].id,
                    name: textSyles[style].name
                })
            }
        })

        const groupedCharStyles = groupBy(charStyles, "id")
        Object.keys(groupedCharStyles).forEach(group => {
            const size = groupedCharStyles[group].length
            const key = groupedCharStyles[group][0].key
            const name = groupedCharStyles[group][0].name
            const indexes = groupedCharStyles[group].map(g => g.index).sort((a, b) => a - b)
            const [startIndex] = [indexes[0]]
            const param = {
                key,
                startIndex,
                name,
                endIndex: startIndex + size,
                id: group
            }
            params = params.concat(param)
        })
        return params
    }

    /**
     * Update text lines normalizing text and adding styles by text line
     */
    getUpdatedTextLines() {
        let allText: any = this.text
        const textLines = this.textLines
        let updatedTextLines: any[] = []
        let textStyleGroupIndex = 0
        let startIndex = 0
        let lineIndex = 0

        textLines.forEach((textLine, index) => {
            let currentTextLine = textLine
            let isBreakLine = false
            lineIndex = index
            const prevUpdatedLine = updatedTextLines[index - 1]
            if (allText[0] === "\n") {
                allText = allText.substring(1)
                textStyleGroupIndex += 1
                if (index) {
                    prevUpdatedLine.breakLine = true
                }
            } else {
                const textLineChange = index ? " " : ""
                currentTextLine = textLineChange + currentTextLine
            }

            const initialPart = allText.substring(0, currentTextLine.length)
            const remainingPart = allText.substring(currentTextLine.length)

            if (index) {
                if (prevUpdatedLine.breakLine) {
                    startIndex = 0
                } else {
                    startIndex = prevUpdatedLine.startIndex + prevUpdatedLine.text.length + 1
                }
            }

            allText = remainingPart
            updatedTextLines = updatedTextLines.concat({
                text: initialPart,
                breakLine: isBreakLine,
                textStyleGroupIndex,
                startIndex,
                lineIndex: lineIndex,
                initialText: textLine
            })
        })
        const textStyleGroups = this.styles
        const updatedTextLinesWithStyles = updatedTextLines.map(updatedTextLine => {
            const textStyleGroup = textStyleGroups[updatedTextLine.textStyleGroupIndex]
            const indexes = Array(updatedTextLine.text.length)
                .fill(0)
                .map((_, i) => (updatedTextLine.startIndex + i).toString())
            const lineStyles = pick(textStyleGroup, indexes)
            return {...updatedTextLine, lineStyles}
        })

        return updatedTextLinesWithStyles
    }

    clearStyles() {
        const styleGroups = this.styles
        Object.keys(styleGroups).forEach(key => {
            const styleGroup = styleGroups[key]
            const styleGroupArray = Object.keys(styleGroup).map(k => ({...styleGroup[k], startIndex: parseInt(k)}))
            const groupedById = groupBy(styleGroupArray, "id")
            Object.keys(groupedById).forEach(k => {
                if (k !== "undefined" && k !== "null") {
                    const group = groupedById[k]
                    const startIndex = group[0].startIndex
                    const endIndex = startIndex + group.length
                    this.setSelectionStart(startIndex)
                    this.setSelectionEnd(endIndex)

                    this.setSelectionStyles(
                        {
                            textBackgroundColor: "",
                            key: null,
                            id: null,
                            name: null
                        },
                        startIndex,
                        endIndex
                    )
                }
            })
        })
    }

    updateParams() {
        this.clearStyles()
        this.setParams()
        this.setParamBounds()
    }

    getRefColor() {
        if (!this.effect || this.effect === "NONE") {
            return this.fill
        }
        // @ts-ignore
        return this[REF_TARGET[this.effect]]
    }

    toObject(propertiesToInclude = []) {
        return fabric.util.object.extend(super.toObject.call(this, propertiesToInclude), {
            fontURL: this.fontURL,
            params: this.params.map(p => ({key: p.key, name: p.name})),
            effect: this.effect,
            light: this.light,
            lineStyles:this.lineStyles,
            bulletStyle:this.bulletStyle,
            bulletStyleMap:this.bulletStyleMap,
            isBulletText:this.isBulletText,
            isNumberBullet:this.isNumberBullet,
        })
    }

    toJSON(propertiesToInclude = []) {
        return fabric.util.object.extend(super.toObject.call(this, propertiesToInclude), {
            fontURL: this.fontURL,
            params: this.params.map(p => ({key: p.key, name: p.name})),
            effect: this.effect,
            light: this.light,
            lineStyles:this.lineStyles,
            bulletStyle:this.bulletStyle,
            bulletStyleMap:this.bulletStyleMap,
            isBulletText:this.isBulletText,
            isNumberBullet:this.isNumberBullet,
        })
    }

    static fromObject(options: StaticTextOptions, callback: Function) {
        return callback && callback(new fabric.StaticText(options))
    }
}

fabric.StaticText = fabric.util.createClass(StaticTextObject, {
    type: StaticTextObject.type
})
fabric.StaticText.fromObject = StaticTextObject.fromObject
fabric.StaticText.prototype._getBulletStyle = function() {
    if (!this.isBulletText) return ;
    return this.bulletStyle;
};
export type StaticTextOptions = fabric.ITextboxOptions & {
    text: string
    fontURL: string
    params: any
    lineStyles:object,
    bulletStyle:number,
    bulletStyleMap:any,
    isBulletText:boolean,
    isNumberBullet:boolean,
}

declare module "fabric" {
    namespace fabric {
        class StaticText extends StaticTextObject {
            constructor(options: IExtendedTextBoxOptions)
        }
    }
}