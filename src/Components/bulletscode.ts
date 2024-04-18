export interface IExtendedTextBoxOptions extends fabric.ITextboxOptions {
    listType?: string;
    listBullet?: string;
    listCounter?: number;
    _renderTextLine?: Function;
  }
  
  export const renderBulletOrNumTextLine = function (
    this: any,
    method: any,
    ctx: any,
    line: any,
    left: any,
    top: any,
    lineIndex: any
  ) {
    const style0 = this.getCompleteStyleDeclaration(lineIndex, 0);
    // Determine the list type
    const bullet =
      this.listType === 'numbered'
        ? [this.listCounter + '.']
        : [this.listBullet];
    const bulletLeft = left - style0.fontSize - 2;
  
    if (line.length) {
      if (!this.isWrapping) {
        if (this.tabPressed ) {
          this._renderChars(
            method,
            ctx,
            bullet,
            bulletLeft + 30,
            top,
            lineIndex
          );
          this.isWrapping = !this.isEndOfWrapping(lineIndex);
        } else {
          this._renderChars(method, ctx, bullet, bulletLeft, top, lineIndex);
          this.isWrapping = !this.isEndOfWrapping(lineIndex);
          if (!this.isWrapping) {
            if (this.listType === 'numbered') {
              this.listCounter++;
            }
          }
        }
      } else if (this.isEndOfWrapping(lineIndex)) {
        this.isWrapping = false;
        if (this.listType === 'numbered') {
          this.listCounter++;
        }
      }
    }
  
    if (lineIndex === this.textLines.length - 1) {
      this.isWrapping = false;
      this.listCounter = 1;
    }
  
    this._renderChars(method, ctx, line, left, top, lineIndex);
  };
  
  