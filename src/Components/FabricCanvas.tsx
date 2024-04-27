import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import '../Utils/BulletText'
import {IExtendedTextBoxOptions} from "./bulletscode";
interface shapeInstance {
  text:fabric.Object
  shape:fabric.Object
}


const FabricCanvas: React.FC = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  var multiply = fabric.util.multiplyTransformMatrices;
  var invert = fabric.util.invertTransform;
  
  const addBulletText = () => {

    const BulletText = new fabric.StaticText({
      text:'Click to add some text.',
      fontSize: 12,
      width: 250,
      fontFamily: "Open Sans",
      borderWidth: 0,
      borderStyle: 'none',
      borderFill: "rgb(0,0,0)",
      listStyle: 'none',
    } as IExtendedTextBoxOptions);
    // BulletText.toggleBulletOnText();
    if (canvasRef.current instanceof fabric.Canvas) {
      canvasRef.current?.add(BulletText);
    }
    BulletText.toggleBulletOnText();
    if (canvasRef.current instanceof fabric.Canvas) {
      canvasRef.current?.renderAll();
    }
  };


  const addNormalText = () => {
    const text = new fabric.Textbox('Normal Text', {
      left: 50,
      top: 100,
      fontSize: 20,
      fontFamily: 'Arial',
    });
    if (canvasRef.current instanceof fabric.Canvas) {
      canvasRef.current?.add(text);

      canvasRef.current?.renderAll();
    }
  };

  const handleAddBulletText = () => {
    addBulletText();
  };

  const handleAddNormalText = () => {
    addNormalText();
  };

  const removeObject = () => {
    if (canvasRef.current instanceof fabric.Canvas) {
      const selectedObject = canvasRef.current?.getActiveObject();

      if (selectedObject) {
        canvasRef.current?.remove(selectedObject);
        canvasRef.current?.renderAll();
      }
    }
  }

  const handleRectWithText = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        name:'shape',
        width: 200,
        height: 300,
        fill: '#B3C8CF',
      });
      const text: fabric.Textbox = new fabric.Textbox('Normal Text', {
        left: rect.left ,
        top: rect?.top + 5,
        lockMovementX:true,
        lockMovementY:true,
        textAlign:'center',
        hasBorders:false,
        selectable:true,
        objectCaching:false,
        fontSize: 20,
        fontFamily: 'Arial',
        width: rect?.width,
        fixedWidth: rect?.width,
        hasControls:false,
        shape:rect,
      });
       (rect as shapeInstance).text = text;
      relateTextObj(rect);
      rect.on('moving',updateShapeText);
      rect.on('scaling',updateShapeText);
      rect.on('rotating',updateShapeText);
      if (canvasRef.current instanceof fabric.Canvas) {
        canvasRef.current?.add(rect);
        canvasRef.current?.add(text);
        canvasRef.current?.renderAll();
      }
    }
  }

  const handleTriangleWithText = () => {
    const canvas = canvasRef.current;
  if (canvas) {
    const triangle = new fabric.Triangle({
      left: 100,
      top: 100,
      width: 200,
      height: 200,
      fill: '#B3C8CF',
      name:'shape',
    });
    const textObject = new fabric.Textbox('Triangle with Text', {
      left: triangle.left,
      top: triangle.top + 100,
      fontSize: 12,
      lockMovementX:true,
      lockMovementY:true,
      selectable:true,
      objectCaching:false,
      textAlign:'center',
      fontFamily: 'Arial',
      width: triangle.width,
      fixedWidth: triangle.width,
      hasControls:false,
      hasBorders:false,
      shape:triangle,
    });
    (triangle as shapeInstance).text = textObject;
    relateTextObj(triangle);
    triangle.on('moving',updateShapeText);
    triangle.on('scaling',updateShapeText);
    triangle.on('rotating',updateShapeText);
    canvas.add(triangle);
    canvas.add(textObject);
    canvas.renderAll();
  }
  };
  
  const handleTrapezoidWithText = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const trapezoid = new fabric.Path('M 100 100 L 200 100 L 250 200 L 50 200 z', {
        fill: '#B3C8CF',
        name:'shape'
      });

      const textObject = new fabric.Textbox('Trapezoid with Text', {
        left: trapezoid.left,
        top: trapezoid.top,
        lockMovementX:true,
        lockMovementY:true,
        fontSize: 12,
        selectable:true,
        objectCaching:false,
        fontFamily: 'Arial',
        textAlign:'center',
        name:'shapeText',
        width: trapezoid?.width,
        fixedWidth: trapezoid?.width,
        shape:trapezoid,
        hasControls:false,
        hasBorders:false,
        // height: trapezoid?.getScaledHeight(),
      });
      (trapezoid as shapeInstance).text = textObject;
      relateTextObj(trapezoid);
      trapezoid.on('moving',updateShapeText);
      trapezoid.on('scaling',updateShapeText);
      trapezoid.on('rotating',updateShapeText);
      canvas.add(trapezoid);
      canvas.add(textObject);
      canvas.renderAll();
    }
  };

  const updateShapeText = (e)=>{
    let actObj = e.transform.target;
    if(actObj){
      let text = actObj.text;
      if(!text.relationship) return;
      let relationship = text.relationship;
      let newTransform = multiply(
          actObj.calcTransformMatrix(),
          relationship
      );
      let opt =  fabric.util.qrDecompose(newTransform);
      text.set({
        flipX: false,
        flipY: false,
      });
      text.setPositionByOrigin(
          { x: opt.translateX, y: opt.translateY },
          'center',
          'center'
      );
      text.set(opt);
      text.setCoords()
    }
  }

  const relateTextObj = (obj)=>{
    const canvas = canvasRef.current;
    if(canvas){
      var textObj  = obj.text;
      var bossTransform = obj.calcTransformMatrix();
      var invertedBossTransform = invert(bossTransform);
      var desiredTransform = multiply(
          invertedBossTransform,
          textObj.calcTransformMatrix()
      );
      // save the desired relation here.
      textObj.relationship = desiredTransform;

    }

  }
  const selectionCreated = (e)=>{
    if (canvasRef.current instanceof fabric.Canvas) {
      let obj = canvasRef.current?.getActiveObject();
      if(obj && obj.name === 'shape'){
        (obj as shapeInstance).text.enterEditing();
        (obj as shapeInstance).text.selectable = true;
        (obj as shapeInstance).text.selectionStart = (obj as shapeInstance).text.text.length;
        (obj as shapeInstance).text.selectionEnd = (obj as shapeInstance).text.text.length;
        (obj as shapeInstance).text.objectCachingt = false;
        canvasRef.current.renderAll();
      }
      else if(obj.type === 'textbox'){
        obj.enterEditing();
        obj.selectioStart = obj.text.length;
        obj.selectioEnd = obj.text.length;
      }
    }
  }
  const selectionCleared = (e)=>{
    if (canvasRef.current instanceof fabric.Canvas) {
      if(e.deselected && e.deselected.length && e.deselected[0].name === 'shape'){
        (e.deselected[0] as shapeInstance).text.exitEditing();
        canvasRef.current.renderAll();
      }
    }
  }
  const objectMoving = (e)=>{
    if (canvasRef.current instanceof fabric.Canvas) {
      let obj = canvasRef.current?.getActiveObject();
      if(obj && obj.name === 'shape'){
        (obj as shapeInstance).text.exitEditing();
      }
    }
  }

  
  useEffect(() => {

      const canvas = new fabric.Canvas('canvas',{preserveObjectStacking:true});
      window.canvas = canvas;
    canvas.on('text:changed',(e: fabric.IEvent): void => {
        if(e.target && (e.target as shapeInstance).shape ){
          relateTextObj((e.target as shapeInstance).shape);
          e.target.width = (e.target as shapeInstance).shape.width;

        }
      })
    canvas.on('selection:created',selectionCreated)
    canvas.on('selection:cleared',selectionCleared)
    canvas.on('object:moving',objectMoving)
      canvasRef.current = canvas;



      return () => {
        canvas.dispose();
      };
    
  }, []);

  return (
    <div>
      <button onClick={handleAddBulletText}>Add Bullet Text</button>
      {/*<button onClick={ToggleBulletOnText}>Apply Bullets</button>*/}
      <button onClick={handleAddNormalText}>Add Normal Text</button>
      <button onClick={handleRectWithText}>Rect with Text</button>
      <button onClick={handleTriangleWithText}>Triangle with Text</button>
      <button onClick={handleTrapezoidWithText}>Trapezoid with Text</button>
      <button onClick={removeObject}>Delete</button>
      <h2>Canvas :</h2>
      <canvas id='canvas' style={{border : '1px solid black'}} width={800} height={600} />
    </div>
  );
};

export default FabricCanvas;
