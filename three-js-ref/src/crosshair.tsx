export const Crosshair = () => (
    <img style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: '20px',
        height: '20px',
        marginLeft: '-10px',
        marginTop: '-10px',
        pointerEvents: 'none',
        zIndex: 1000,
        border: '1px solid black',
        borderRadius: '50%',
        boxSizing: 'border-box',
        background: 'rgba(112, 68, 68, 0.1)'
    }}src="./crosshair.png"/>
);
