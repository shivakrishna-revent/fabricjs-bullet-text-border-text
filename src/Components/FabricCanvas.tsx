import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { IExtendedTextBoxOptions, renderBulletOrNumTextLine } from './bulletscode';


const FabricCanvas: React.FC = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  
  const addBulletText = () => {

    const BulletText = new fabric.Textbox('Bullet Points', {
      fontFamily: 'sans-serif',
      lineHeight: 1.4,
      left: 100,
      top: 150,
      width: 450,
      fontSize: 20,
      objectCaching: false,
      isWrapping: false,
      listType: 'bullet',
      listBullet: '\u2022',
      listCounter: 0,
      fill: '#404040',
    } as IExtendedTextBoxOptions);
    BulletText._renderTextLine = renderBulletOrNumTextLine;
    canvasRef.current?.add(BulletText);
    canvasRef.current?.renderAll();
  };

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
        fontSize: 20,
        fontFamily: 'Arial',
        width: rect?.width
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
      left: triangle.left + 40,
      top: triangle.top + 100,
      fontSize: 20,
      fontFamily: 'Arial',
      width: 150,
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
        left: 100,
        top: 105,
        fontSize: 20,
        fontFamily: 'Arial',
        width: 200,
      });
      canvas.add(trapezoid);
      canvas.add(textObject);
      canvas.renderAll();
    }
  };
  
  useEffect(() => {
    
      const canvas = new fabric.Canvas('canvas');

      canvasRef.current = canvas;


      return () => {
        canvas.dispose();
      };
    
  }, []);

  return (
    <div>
      <button onClick={handleAddBulletText}>Add Bullet Text</button>
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
