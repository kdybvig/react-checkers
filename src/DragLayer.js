//the drag layer is need because the default drag image shows the square with the checker
import React, { Component } from 'react';
import { DragLayer } from 'react-dnd';


const collect = (monitor) => {
  return {
    item: monitor.getItem(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging()
  };
}

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  //always place the dragged image on top
  zIndex: 10,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
}

//getItemStyles modifies code from https://react-dnd.github.io/react-dnd/docs-drag-layer.html
const getItemStyles = (props) => {
  const { currentOffset } = props;
  if (!currentOffset) {
    return {
      display: 'none'
    };
  }
  //ES6 destructuring
  const { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  const w = window.innerWidth;
  //sideLength variable keeps checker size consistent with board
  let sideLength;
  if (w>650) {
    sideLength = 75
  } else {
    sideLength = 50
  }
  return {
    width: sideLength,
    height: sideLength,
    transform: transform,
    WebkitTransform: transform
  };
}

class DragChecker extends Component {
  render() {
    //ES6 destructuring
    const {item, isDragging } = this.props;
    //don't show a drag image when the checker is not dragging
    if (!isDragging) return null
    return (
      <div style={layerStyles}>
        <div style={getItemStyles(this.props)}>
        <div className= {item.color === 'red' ? 'checker red' : 'checker'}>
          <div className ='middle'>
          </div>
          <div className ='bottom'>
          </div>
          <div className='top'>
          </div>
          <div className = 'top-decorator'>
          </div>
          <div className = 'top-decorator2'>
          </div>
          {item.isKing && (
          <div>
          <div className ='middle king'>
          </div>
          <div className ='bottom king'>
          </div>
          <div className='top king'>
          </div>
          <div className = 'top-decorator king'>
          </div>
          <div className = 'top-decorator2 king'>
          </div>
          </div>
        )}
      </div>
        </div>
      </div>
      );
  }
}


export default DragLayer(collect)(DragChecker);
