import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend'
import Types from './ItemTypes'



const checkerSource = {
  //only checkers that have legal moves can be dragged
  canDrag(props) {
    return props.canMove;
  },

  beginDrag(props) {
    //color and king stored to item for Draglayer.js, position stored for Square.js
    const item = {color: props.color, isKing: props.isKing, position: props.position}
    return item;
   }
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
}


class Checker extends Component {
  componentDidMount() {
    const { connectDragPreview } = this.props
    //elimnate any existing drag preview, the drag layer will be dragged instead
    if (connectDragPreview) {
    connectDragPreview(getEmptyImage(), {
      captureDraggingState: true,
      })
    }
  }
  render () {
    const {connectDragSource, isDragging} = this.props
    //created the checker image using css (see board.css)
    return connectDragSource (
      <div className= {this.props.color === 'red' ? 'checker red' : 'checker'}
      style={{
        opacity: isDragging ? 0 : 1,
        cursor: this.props.canMove ? 'pointer' : 'no-drop'
      }}>
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
        {this.props.isKing && (
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
    )
  }
}

export default DragSource(Types.CHECKER, checkerSource, collect)(Checker);
