import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { IExtendedTextBoxOptions, renderBulletOrNumTextLine } from './bulletscode';
import '../Utils/BulletText'


const FabricCanvas: React.FC = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  
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
    });
    // BulletText.toggleBulletOnText();
    canvasRef.current?.add(BulletText);
    BulletText.toggleBulletOnText();
    canvasRef.current?.renderAll();
  };
const ToggleBulletOnText = () => {
    let obj = canvasRef.current?.getActiveObject();
    if(obj && obj.type === "StaticText"){
   obj.toggleBulletOnText();

    }
  }

  const addNormalText = () => {
    const text = new fabric.Textbox('Normal Text', {
      left: 50,
      top: 100,
      fontSize: 20,
      fontFamily: 'Arial',
    });
    canvasRef.current?.add(text);
    canvasRef.current?.renderAll();
  };

  const handleAddBulletText = () => {
    addBulletText();
  };

  const handleAddNormalText = () => {
    addNormalText();
  };

  const removeObject = () => {
     const selectedObject = canvasRef.current?.getActiveObject();
     if(selectedObject){
       canvasRef.current?.remove(selectedObject);
       canvasRef.current?.renderAll();
     }
  }

  const addRectangle = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: '#B3C8CF',
      });
      canvasRef.current?.add(rect);
      canvasRef.current?.renderAll();
    }
  };
  const handleRectWithText = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 300,
        fill: '#B3C8CF',
      });
      const text = new fabric.Textbox('Normal Text', {
        left: rect.left ,
        top: rect?.top + 5,
        textAlign:'center',
        fontSize: 20,
        fontFamily: 'Arial',
        width: rect?.width,
      });
      canvasRef.current?.add(rect);
      canvasRef.current?.add(text);
      canvasRef.current?.renderAll();
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
    });
    const textObject = new fabric.Textbox('Triangle with Text', {
      left: triangle.left,
      top: triangle.top + 150,
      fontSize: 20,
      textAlign:'center',
      fontFamily: 'Arial',
      width: triangle.width,
    });
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
      });
      const textObject = new fabric.Textbox('Trapezoid with Text', {
        left: trapezoid.left,
        top: 170,
        fontSize: 20,
        fontFamily: 'Arial',
        textAlign:'center',
        width: trapezoid?.width,
        // height: trapezoid?.getScaledHeight(),
      });
      canvas.add(trapezoid);
      canvas.add(textObject);
      canvas.renderAll();
    }
  };
  
  useEffect(() => {

      const canvas = new fabric.Canvas('canvas',{preserveObjectStacking:true});
      window.canvas = canvas;

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
