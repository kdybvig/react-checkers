import React from 'react';

const Chalkboard = (props) => {
  return (
    <h3 className = 'chalkboard'
    style = {{color: props.color}}>
    {props.message}</h3>
  )
}

export default Chalkboard;
