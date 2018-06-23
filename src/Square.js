import React, {Component} from 'react';
import { DropTarget } from 'react-dnd'
import Types from './ItemTypes'
import Checker from './Checker'


const squareTarget = {
  canDrop (props, monitor) {
    if (monitor.didDrop()) {
      return;
    }
    const item = monitor.getItem();
    const destination = props.position;
    const origin = item.position;
    return props.legalMove(origin, destination);
  },

  drop (props, monitor) {
    const item = monitor.getItem();
    const destination = props.position;
    const origin = item.position;
    //move the checker when dropped
    props.moveChecker(origin, destination)
  }
}

const collect = (connect, monitor) => {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  }
}

class Square extends Component{
  render() {
    const {connectDropTarget} = this.props
    let isKing;
    let color;
    let position;
    let key;
    if (this.props.hasChecker) ({isKing, color, position, key} = this.props.hasChecker)
    return connectDropTarget(
      <div className = {`square ${this.props.color}`}>
        {this.props.hasChecker &&
          <Checker
            canMove = {this.props.canMove}
            isKing = {isKing}
            color= {color}
            position = {position}
            key = {key}/> }
      </div>
    )
  }
}

export default DropTarget(Types.CHECKER, squareTarget, collect)(Square);
