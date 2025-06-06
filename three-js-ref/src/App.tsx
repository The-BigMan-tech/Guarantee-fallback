import { useEffect } from 'react'
import * as THREE from 'three';
import {cube} from "./three-scenes/cube.three"
import animateCube from './three-scenes/cube.three';
import './App.css'

function App() {
    useEffect(()=>{
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )
        const renderer = new THREE.WebGLRenderer();

        scene.add(cube)
        camera.position.z = 5;
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );
        renderer.setAnimationLoop(()=>{
            animateCube()
            renderer.render( scene, camera );
        });
    },[])

    return (
        <>
        
        </>
    )
}
export default App
