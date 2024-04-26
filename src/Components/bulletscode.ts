export interface IExtendedTextBoxOptions extends fabric.ITextboxOptions {
    text: string;
    fontSize: number;
    width: number;
    fontFamily: string;
    borderWidth: number;
    borderStyle: string;
    borderFill: string;
    listStyle: string;
  }
  
  // The rendering method/context, line content, position, and line index are passed as parameters
export const renderBulletOrNumTextLine = function (
    this: any,
    method: any,
    ctx: any,
    line: any,
    left: any,
    top: any,
    lineIndex: any
) {
    // Get the complete style declaration for the line
    const style0 = this.getCompleteStyleDeclaration(lineIndex, 0);
    // Determine the type of list (bullet or numbered)
    const bullet =
        this.listType === 'numbered'
        ? [this.listCounter + '.']  // If numbered list, use numbers with list counter
        : [this.listBullet];        // If bullet list, use the specified bullet symbol
    
    // Calculate the left position for the bullet
    const bulletLeft = left - style0.fontSize - 2;
  
    // Check if the line has content
    if (line.length) {
        // If not wrapping
        if (!this.isWrapping) {
            // Check if the tab key is pressed
            if (this.tabPressed ) {
                // Render characters with bullet and adjust left position
                this._renderChars(
                    method,
                    ctx,
                    bullet,
                    bulletLeft + 30,  // Adjust left position for indentation
                    top,
                    lineIndex
                );
                // Set wrapping state
                this.isWrapping = !this.isEndOfWrapping(lineIndex);
            } else {
                // Render characters with bullet
                this._renderChars(method, ctx, bullet, bulletLeft, top, lineIndex);
                // Set wrapping state
                this.isWrapping = !this.isEndOfWrapping(lineIndex);
                // If not wrapping anymore, increment list counter (if numbered list)
                if (!this.isWrapping) {
                    if (this.listType === 'numbered') {
                        this.listCounter++;
                    }
                }
            }
        } else if (this.isEndOfWrapping(lineIndex)) {
            // If end of wrapping, reset wrapping state and increment list counter (if numbered list)
            this.isWrapping = false;
            if (this.listType === 'numbered') {
                this.listCounter++;
            }
        }
    }
  
    // If it's the last line, reset wrapping state and list counter (if numbered list)
    if (lineIndex === this.textLines.length - 1) {
        this.isWrapping = false;
        this.listCounter = 1;
    }
  
    // Render the characters of the line
    this._renderChars(method, ctx, line, left, top, lineIndex);
};

  