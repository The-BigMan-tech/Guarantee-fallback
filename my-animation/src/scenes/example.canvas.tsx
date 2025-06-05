import {makeScene2D, Circle,Rect} from '@motion-canvas/2d';
import {all, chain, createRef} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const myCircle = createRef<Circle>();
  view.add(
    <>
      <Rect width="100%" height="100%" fill="#000000" />
      <Circle
          ref={myCircle}
          x={-300}
          width={140}
          height={140}
          fill="#e13238"
      />
    </>
  );
  const moveBackAndFort = myCircle().position.x(300, 1)
  yield* chain(
      moveBackAndFort,
  );
});
