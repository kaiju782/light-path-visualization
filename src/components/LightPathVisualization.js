import React, { useState, useCallback } from 'react';

const LightPathVisualization = () => {
  const [kPosition, setKPosition] = useState(-10);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lightDistance, setLightDistance] = useState(0);
  
  const width = 800;
  const height = 600;
  const baseScale = 20;
  const scale = baseScale * zoomLevel;
  
  const getControlPoints = useCallback((k) => {
    const J = {x: -11.5, y: -5}; 
    const Jp = {x: 11.5, y: -5};
    const K = {x: 0, y: k}; 
    
    const offset = 8;
    const controlYOffset = Math.abs(k + 5) * 0.8;
    
    const P1 = {
      x: -offset,
      y: -5 - controlYOffset
    };
    const P2 = {
      x: offset,
      y: -5 - controlYOffset
    };
    
    return {J, Jp, K, P1, P2};
  }, []);

  const getBezierPoint = useCallback((points, t) => {
    const {J: P0, P1, P2, Jp: P3} = points;
    return {
      x: Math.pow(1-t, 3)*P0.x + 3*Math.pow(1-t, 2)*t*P1.x + 3*(1-t)*Math.pow(t, 2)*P2.x + Math.pow(t, 3)*P3.x,
      y: Math.pow(1-t, 3)*P0.y + 3*Math.pow(1-t, 2)*t*P1.y + 3*(1-t)*Math.pow(t, 2)*P2.y + Math.pow(t, 3)*P3.y
    };
  }, []);

  const getBezierTangent = useCallback((points, t) => {
    const {J: P0, P1, P2, Jp: P3} = points;
    const dx = -3*Math.pow(1-t, 2)*P0.x + 3*(1-4*t+3*Math.pow(t, 2))*P1.x + 3*(2*t-3*Math.pow(t, 2))*P2.x + 3*Math.pow(t, 2)*P3.x;
    const dy = -3*Math.pow(1-t, 2)*P0.y + 3*(1-4*t+3*Math.pow(t, 2))*P1.y + 3*(2*t-3*Math.pow(t, 2))*P2.y + 3*Math.pow(t, 2)*P3.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    return {x: dx/len, y: dy/len};
  }, []);

  const getReflectionVector = useCallback((incident, normal) => {
    const dot = incident.x * normal.x + incident.y * normal.y;
    return {
      x: incident.x - 2 * dot * normal.x,
      y: incident.y - 2 * dot * normal.y
    };
  }, []);

  const findCircleIntersection = useCallback((origin, direction, center, radius) => {
    const dx = origin.x - center.x;
    const dy = origin.y - center.y;
    
    const a = direction.x * direction.x + direction.y * direction.y;
    const b = 2 * (dx * direction.x + dy * direction.y);
    const c = dx * dx + dy * dy - radius * radius;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) return null;
    
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    if (t1 > 0.001) return {
      x: origin.x + t1 * direction.x,
      y: origin.y + t1 * direction.y
    };
    
    if (t2 > 0.001) return {
      x: origin.x + t2 * direction.x,
      y: origin.y + t2 * direction.y
    };
    
    return null;
  }, []);

  const findIntersection = useCallback((origin, direction, points) => {
    let bestT = null;
    let bestDist = Infinity;
    let bestPoint = null;

    for(let t = 0; t <= 1; t += 0.001) {
      const point = getBezierPoint(points, t);
      
      const dx = point.x - origin.x;
      const dy = point.y - origin.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      const dot = dx * direction.x + dy * direction.y;
      
      const perpX = dx - dot * direction.x;
      const perpY = dy - dot * direction.y;
      const perpDist = Math.sqrt(perpX*perpX + perpY*perpY);
      
      if(dot > 0 && perpDist < 0.1 && dot < bestDist) {
        bestDist = dot;
        bestT = t;
        bestPoint = point;
      }
    }
    
    return bestT !== null ? {t: bestT, point: bestPoint} : null;
  }, [getBezierPoint]);

  const findEllipseIntersection = useCallback((origin, direction, center, rx, ry) => {
    const dx = origin.x - center.x;
    const dy = origin.y - center.y;
    
    const a = (direction.x * direction.x) / (rx * rx) + (direction.y * direction.y) / (ry * ry);
    const b = 2 * (dx * direction.x / (rx * rx) + dy * direction.y / (ry * ry));
    const c = dx * dx / (rx * rx) + dy * dy / (ry * ry) - 1;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) return null;
    
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    if (t1 > 0.001) return {
      x: origin.x + t1 * direction.x,
      y: origin.y + t1 * direction.y
    };
    
    if (t2 > 0.001) return {
      x: origin.x + t2 * direction.x,
      y: origin.y + t2 * direction.y
    };
    
    return null;
  }, []);

  const drawReflectedRay = useCallback((origin, direction, points, circleCenter, circleRadius) => {
    const firstIntersection = findIntersection(origin, direction, points);
    if (!firstIntersection) return null;

    const firstTangent = getBezierTangent(points, firstIntersection.t);
    const firstNormal = { x: -firstTangent.y, y: firstTangent.x };
    const firstReflection = getReflectionVector(direction, firstNormal);

    const circleIntersection = findCircleIntersection(
      firstIntersection.point,
      firstReflection,
      circleCenter,
      circleRadius
    );
    
    if (!circleIntersection) return {
      firstIntersection,
      circleIntersection: null,
      secondCircleIntersection: null,
      reflectionEnd: {
        x: firstIntersection.point.x + circleRadius * 2 * firstReflection.x,
        y: firstIntersection.point.y + circleRadius * 2 * firstReflection.y
      }
    };

    const circleNormal = {
      x: (circleIntersection.x - circleCenter.x) / circleRadius,
      y: (circleIntersection.y - circleCenter.y) / circleRadius
    };
    const secondReflection = getReflectionVector(firstReflection, circleNormal);

    const curveIntersection = findIntersection(
      circleIntersection,
      secondReflection,
      points
    );

    if (curveIntersection) {
      const curveTangent = getBezierTangent(points, curveIntersection.t);
      const curveNormal = { x: -curveTangent.y, y: curveTangent.x };
      const curveReflection = getReflectionVector(secondReflection, curveNormal);

      const blueCircleIntersection = findCircleIntersection(
        curveIntersection.point,
        curveReflection,
        circleCenter,
        circleRadius
      );

      if (blueCircleIntersection) {
        const blueCircleNormal = {
          x: (blueCircleIntersection.x - circleCenter.x) / circleRadius,
          y: (blueCircleIntersection.y - circleCenter.y) / circleRadius
        };
        const pinkReflection = getReflectionVector(curveReflection, blueCircleNormal);

        const pinkCurveIntersection = findIntersection(
          blueCircleIntersection,
          pinkReflection,
          points
        );

        if (pinkCurveIntersection) {
          return {
            firstIntersection,
            circleIntersection,
            secondCircleIntersection: curveIntersection.point,
            reflectionEnd: blueCircleIntersection,
            pinkReflection: {
              start: blueCircleIntersection,
              end: pinkCurveIntersection.point
            }
          };
        }

        const pinkCircleIntersection = findCircleIntersection(
          blueCircleIntersection,
          pinkReflection,
          circleCenter,
          circleRadius
        );

        if (pinkCircleIntersection) {
          const pinkCircleNormal = {
            x: (pinkCircleIntersection.x - circleCenter.x) / circleRadius,
            y: (pinkCircleIntersection.y - circleCenter.y) / circleRadius
          };
          const skyblueReflection = getReflectionVector(pinkReflection, pinkCircleNormal);

          const skyblueEllipseIntersection = findEllipseIntersection(
            pinkCircleIntersection,
            skyblueReflection,
            {x: 0, y: 0},
            7.5,
            5
          );

          const skyblueLineIntersection = findLineIntersection(
            pinkCircleIntersection,
            skyblueReflection,
            points.J,
            points.Jp
          );

          const skyblueIntersections = [
            skyblueEllipseIntersection && { point: skyblueEllipseIntersection, type: 'ellipse' },
            skyblueLineIntersection && { point: skyblueLineIntersection, type: 'line' }
          ].filter(Boolean);

          const closestSkyblueIntersection = findClosestIntersection(pinkCircleIntersection, skyblueIntersections);

          return {
            firstIntersection,
            circleIntersection,
            secondCircleIntersection: curveIntersection.point,
            reflectionEnd: blueCircleIntersection,
            pinkReflection: {
              start: blueCircleIntersection,
              end: pinkCircleIntersection
            },
            skyblueReflection: {
              start: pinkCircleIntersection,
              end: closestSkyblueIntersection ? closestSkyblueIntersection.point : {
                x: pinkCircleIntersection.x + circleRadius * 2 * skyblueReflection.x,
                y: pinkCircleIntersection.y + circleRadius * 2 * skyblueReflection.y
              }
            }
          };
        }
      }

      const ellipseIntersection = findEllipseIntersection(
        curveIntersection.point,
        curveReflection,
        {x: 0, y: 0},
        7.5,
        5
      );

      const lineIntersection = findLineIntersection(
        curveIntersection.point,
        curveReflection,
        points.J,
        points.Jp
      );

      const intersections = [
        ellipseIntersection && { point: ellipseIntersection, type: 'ellipse' },
        lineIntersection && { point: lineIntersection, type: 'line' }
      ].filter(Boolean);

      const closestIntersection = findClosestIntersection(curveIntersection.point, intersections);

      return {
        firstIntersection,
        circleIntersection,
        secondCircleIntersection: curveIntersection.point,
        reflectionEnd: closestIntersection ? closestIntersection.point : {
          x: curveIntersection.point.x + circleRadius * 2 * secondReflection.x,
          y: curveIntersection.point.y + circleRadius * 2 * secondReflection.y
        }
      };
    }

    const secondCircleIntersection = findCircleIntersection(
      circleIntersection,
      secondReflection,
      circleCenter,
      circleRadius
    );

    if (!secondCircleIntersection) {
      return {
        firstIntersection,
        circleIntersection,
        secondCircleIntersection: null,
        reflectionEnd: {
          x: circleIntersection.x + circleRadius * 2 * secondReflection.x,
          y: circleIntersection.y + circleRadius * 2 * secondReflection.y
        }
      };
    }

    const secondCircleNormal = {
      x: (secondCircleIntersection.x - circleCenter.x) / circleRadius,
      y: (secondCircleIntersection.y - circleCenter.y) / circleRadius
    };
    const thirdReflection = getReflectionVector(secondReflection, secondCircleNormal);

    const ellipseIntersection = findEllipseIntersection(
      secondCircleIntersection,
      thirdReflection,
      {x: 0, y: 0},
      7.5,
      5
    );

    const lineIntersection = findLineIntersection(
      secondCircleIntersection,
      thirdReflection,
      points.J,
      points.Jp
    );

    const intersections = [
      ellipseIntersection && { point: ellipseIntersection, type: 'ellipse' },
      lineIntersection && { point: lineIntersection, type: 'line' }
    ].filter(Boolean);

    const closestIntersection = findClosestIntersection(secondCircleIntersection, intersections);

    return {
      firstIntersection,
      circleIntersection,
      secondCircleIntersection,
      reflectionEnd: closestIntersection ? closestIntersection.point : {
        x: secondCircleIntersection.x + circleRadius * 2 * thirdReflection.x,
        y: secondCircleIntersection.y + circleRadius * 2 * thirdReflection.y
      }
    };
  }, [findIntersection, getBezierTangent, getReflectionVector, findCircleIntersection, findEllipseIntersection]);

  const toScreen = useCallback((p) => ({
    x: p.x * scale + width/2,
    y: -p.y * scale + height/2
  }), [scale, width, height]);

  const drawBezier = useCallback((points) => {
    const {J, Jp, K, P1, P2} = points;
    const sJ = toScreen(J);
    const sJp = toScreen(Jp);
    const sK = toScreen(K);
    const sP1 = toScreen(P1);
    const sP2 = toScreen(P2);
    
    return `M ${sJ.x} ${sJ.y} 
            C ${sP1.x} ${sP1.y},
              ${sP2.x} ${sP2.y},
              ${sJp.x} ${sJp.y}`;
  }, [toScreen]);

  const calculateRayVector = useCallback((angle) => {
    const baseAngle = 45;
    const totalAngle = (baseAngle + angle) * Math.PI / 180;
    
    return {
      x: Math.cos(totalAngle),
      y: Math.sin(totalAngle)
    };
  }, []);

  const points = getControlPoints(kPosition);

  const findLineIntersection = (origin, direction, p1, p2) => {
    // 선분과 광선의 교차점 계산
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = origin.x, y3 = origin.y;
    const x4 = origin.x + direction.x, y4 = origin.y + direction.y;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denominator === 0) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    if (t >= 0 && t <= 1 && u >= 0) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }
    return null;
  };

  const findClosestIntersection = (origin, intersections) => {
    return intersections.reduce((closest, current) => {
      const dist = Math.sqrt(
        Math.pow(current.point.x - origin.x, 2) +
        Math.pow(current.point.y - origin.y, 2)
      );
      if (!closest || dist < closest.dist) {
        return { ...current, dist };
      }
      return closest;
    }, null);
  };

  return (
    <div className="w-full max-w-4xl p-4">
      <div className="mb-4">
        <label className="block mb-2">K Position (y-axis):</label>
        <input 
          type="range" 
          min="-25" 
          max="-5" 
          step="0.5"
          value={kPosition}
          onChange={(e) => setKPosition(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-center mt-2">K y-position: {kPosition}</div>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">L Position (distance):</label>
        <input 
          type="range" 
          min="-5" 
          max="5" 
          step="0.5"
          value={lightDistance}
          onChange={(e) => setLightDistance(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-center mt-2">L distance: {lightDistance}</div>
      </div>
      
      <div className="mb-4 flex justify-center gap-4">
        <button 
          onClick={() => setZoomLevel(prev => Math.max(0.2, prev - 0.1))}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          줌 아웃
        </button>
        <button 
          onClick={() => setZoomLevel(1)}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          리셋
        </button>
        <button 
          onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          줌 인
        </button>
        <span className="px-4 py-2">줌 레벨: {(zoomLevel * 100).toFixed(0)}%</span>
      </div>
      
      <svg width={width} height={height} className="border border-gray-300">
        <line 
          x1="0" y1={height/2} 
          x2={width} y2={height/2} 
          stroke="gray" 
          strokeWidth="1"
        />
        <line 
          x1={width/2} y1="0" 
          x2={width/2} y2={height} 
          stroke="gray" 
          strokeWidth="1"
        />
        
        <circle 
          cx={width/2}
          cy={height/2}
          r={scale * 20}
          fill="none"
          stroke="black"
          strokeWidth={1 / zoomLevel}
        />

        <ellipse
          cx={width/2}
          cy={height/2}
          rx={scale * 7.5}
          ry={scale * 5}
          fill="rgba(0,0,255,0.1)"
          stroke="blue"
          strokeWidth={1 / zoomLevel}
        />

        <path
          d={drawBezier(points)}
          fill="none"
          stroke="red"
          strokeWidth="2"
        />

        {Object.entries(points).map(([key, point]) => (
          <circle
            key={key}
            cx={toScreen(point).x}
            cy={toScreen(point).y}
            r="4"
            fill={key === 'K' ? 'red' : 'black'}
          />
        ))}

        {(() => {
          const L = {
            x: -12.5 + lightDistance,
            y: -12.5 + lightDistance
          };
          const sL = toScreen(L);
          const angles = [-30, -15, 0, 15, 30];
          const circleCenter = {x: 0, y: 0};
          const circleRadius = 20;

          return (
            <>
              <circle cx={sL.x} cy={sL.y} r="4" fill="purple"/>
              {angles.map((angle, i) => {
                const rayVector = calculateRayVector(angle);
                const reflectionPaths = drawReflectedRay(L, rayVector, points, circleCenter, circleRadius);
                
                if (reflectionPaths) {
                  const {firstIntersection, circleIntersection, secondCircleIntersection, reflectionEnd} = reflectionPaths;
                  const sFirstIntersection = toScreen(firstIntersection.point);
                  
                  return (
                    <g key={i}>
                      <line
                        x1={sL.x}
                        y1={sL.y}
                        x2={sFirstIntersection.x}
                        y2={sFirstIntersection.y}
                        stroke="purple"
                        strokeWidth="1"
                        strokeDasharray="4"
                      />
                      <line
                        x1={sFirstIntersection.x}
                        y1={sFirstIntersection.y}
                        x2={toScreen(circleIntersection).x}
                        y2={toScreen(circleIntersection).y}
                        stroke="orange"
                        strokeWidth="1"
                        strokeDasharray="4"
                      />
                      {secondCircleIntersection ? (
                        <>
                          <line
                            x1={toScreen(circleIntersection).x}
                            y1={toScreen(circleIntersection).y}
                            x2={toScreen(secondCircleIntersection).x}
                            y2={toScreen(secondCircleIntersection).y}
                            stroke="green"
                            strokeWidth="1"
                            strokeDasharray="4"
                          />
                          <line
                            x1={toScreen(secondCircleIntersection).x}
                            y1={toScreen(secondCircleIntersection).y}
                            x2={toScreen(reflectionEnd).x}
                            y2={toScreen(reflectionEnd).y}
                            stroke="blue"
                            strokeWidth="1"
                            strokeDasharray="4"
                          />
                          {reflectionPaths.pinkReflection && (
                            <line
                              x1={toScreen(reflectionPaths.pinkReflection.start).x}
                              y1={toScreen(reflectionPaths.pinkReflection.start).y}
                              x2={toScreen(reflectionPaths.pinkReflection.end).x}
                              y2={toScreen(reflectionPaths.pinkReflection.end).y}
                              stroke="#FF1493"
                              strokeWidth="1"
                              strokeDasharray="4"
                            />
                          )}
                          {reflectionPaths.skyblueReflection && (
                            <line
                              x1={toScreen(reflectionPaths.skyblueReflection.start).x}
                              y1={toScreen(reflectionPaths.skyblueReflection.start).y}
                              x2={toScreen(reflectionPaths.skyblueReflection.end).x}
                              y2={toScreen(reflectionPaths.skyblueReflection.end).y}
                              stroke="#00BFFF"
                              strokeWidth="1"
                              strokeDasharray="4"
                            />
                          )}
                        </>
                      ) : (
                        <line
                          x1={toScreen(circleIntersection).x}
                          y1={toScreen(circleIntersection).y}
                          x2={toScreen(reflectionEnd).x}
                          y2={toScreen(reflectionEnd).y}
                          stroke="green"
                          strokeWidth="1"
                          strokeDasharray="4"
                        />
                      )}
                    </g>
                  );
                }
                return null;
              })}
            </>
          );
        })()}

        <line
          x1={toScreen(points.J).x}
          y1={toScreen(points.J).y}
          x2={toScreen(points.Jp).x}
          y2={toScreen(points.Jp).y}
          stroke="red"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

export default LightPathVisualization;