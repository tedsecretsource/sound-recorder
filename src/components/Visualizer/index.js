import { useEffect, useRef, useState } from 'react';
import styles from './style.css';
import PropTypes from 'prop-types';

const Visualizer = ({stream}) => {

    const canvasRef = useRef()
    
    return (
        <>
            <canvas ref={canvasRef} className="visualizer"></canvas>
        </>
    );
    
}

Visualizer.propTypes = {
    //stream: PropTypes.node
};

export default Visualizer