import { useState,useEffect, Fragment, useRef } from 'react'
import resistorPNG from './assets/symbols/resistor.png'
import voltagePNG from './assets/symbols/voltage.png'
import groundPNG from './assets/symbols/ground.png'
import {Stage, Layer, Circle, Line, Image, Text} from 'react-konva'
const grid_size = 40
const canvas_width = window.innerWidth
const canvas_height = window.innerHeight
function App() {
  const dragStart = useRef(null)
  const [panOffset, setPanOffset] = useState({x:0,y:0})
  const [resistorImg, setResistorImg] = useState(null)
  const [voltageImg, setVoltageImg] = useState(null)
  const [groundImg, setGroundImg] = useState(null)
  const [solverResults, setSolverResults] = useState(null)
  const [components, setComponents] = useState(
    [
    { id: "V1",
      type: "voltage_source",
      value: 5.0,
      nodes: ["n1", "gnd"], 
      from: {x: 200, y: 100},
      to: {x: 200, y: 300} },

    { id: "R1",
      type: "resistor",
      value: 10000.0,
      nodes: ["n1", "n2"],
      from: {x: 400, y: 100},
      to: {x: 400, y: 300} },
    { id: "R2",
      type: "resistor",
      value: 5000.0,
      nodes: ["n2", "gnd"],
      from: {x: 400, y: 300},
      to: {x: 400, y: 500} },
  ]
  )
  function formatVoltage(value){
    const abs = Math.abs(value)
    if (abs >= 1) return value.toFixed(2) + "V"
    if (abs >= 0.001) return (value*1000).toFixed(2) + "mV"
    return (value * 1000000).toFixed(2) + "µV"

  }
  function formatCurrent(value){
    const abs = Math.abs(value)
    if (abs >= 1) return value.toFixed(2) + "A"
    if (abs >= 0.001) return (value*1000).toFixed(2) + "mA"
    return (value * 1000000).toFixed(2) + "µA"

  }

  function handleMouseDown(e){
    if (e.target !== e.target.getStage()) return
    const pos = e.target.getStage().getPointerPosition()
    dragStart.current = {x: pos.x - panOffset.x, y: pos.y - panOffset.y}
  }
  function handleMouseMove(e){
    if (!dragStart.current) return
    const pos = e.target.getStage().getPointerPosition()
    setPanOffset({
      x: pos.x - dragStart.current.x,
      y: pos.y - dragStart.current.y
    })
  }
  function handleMouseUp(){
    dragStart.current = null
  }
  useEffect(()=> {
    const img = new window.Image()
    img.src = resistorPNG
    img.onload = () => setResistorImg(img)
  },[])
  useEffect(()=> {
    const img = new window.Image()
    img.src = voltagePNG
    img.onload = () => setVoltageImg(img)
  },[])
  useEffect(()=> {
    const img = new window.Image()
    img.src = groundPNG
    img.onload = () => setGroundImg(img)
  },[])


  const nodePosition = {
    n1:{x:200, y:100},
    n1right:{x:400, y:100},
    n2:{x:400, y:300},
    gnd:{x:200, y:300},
    gnd2:{x:400, y:500}
  }
  const gridOffsetX = panOffset.x % grid_size
  const gridOffsetY = panOffset.y % grid_size

  useEffect(()=> {
    async function loadResults(){
      const response = await fetch("http://localhost:8000/solve",{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          nodes: ["gnd", "n1", "n2"],
          components  :  [
    { id: "V1",
      type: "voltage_source",
      value: 5.0,
      nodes: ["n1", "gnd"], 
      from: {x: 200, y: 100},
      to: {x: 200, y: 300} },

    { id: "R1",
      type: "resistor",
      value: 10000.0,
      nodes: ["n1", "n2"],
      from: {x: 400, y: 100},
      to: {x: 400, y: 300} },
    { id: "R2",
      type: "resistor",
      value: 5000.0,
      nodes: ["n2", "gnd"],
      from: {x: 400, y: 300},
      to: {x: 400, y: 500} },
  ]})})
    const data = await response.json()
    setSolverResults(data)
    console.log(data)
    }
    loadResults()
  },[])

  return(
  <>
  <Stage width={canvas_width} height ={canvas_height} style={{background: 'white'}}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}>
      <Layer>
      {  Array.from({length:canvas_width/grid_size}, (_,i)=> i * grid_size).map(
        vertical => (
          (<Line key ={`v-${vertical}`} points={[vertical+gridOffsetX, 0,vertical + gridOffsetX, canvas_height]} stroke = "#ddd" strokeWidth={1}/>)
        )
      )}
      {  Array.from({length:canvas_height/grid_size}, (_,i)=> i * grid_size).map(
        horizontal => (
          (<Line key ={`h-${horizontal}`} points={[0, horizontal + gridOffsetY,canvas_width, horizontal + gridOffsetY]}stroke = "#ddd" strokeWidth={2}/>)
        )
      )}</Layer>
    <Layer x={panOffset.x}y={panOffset.y}>
        {components.map(
          component => {
          const from = component.from
          const to  = component.to
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) /2
          const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180/Math.PI)
          if (component.type === "resistor"){
            return(<Fragment key={component.id}>
              <Image  image = {resistorImg} x = {midX} y = {midY} width={60} height={60} rotation={angle} offsetX={30} offsetY={30}/>
              <Line  points={[from.x, from.y, midX, midY-30]} stroke = "black" strokeWidth={2}/>
              <Line  points={[midX, midY+30, to.x, to.y]} stroke = "black" strokeWidth={2}/>
          {solverResults && solverResults.branch_current[component.id] !== undefined &&(
          <Text
           x={midX+ 15}
           y={midY-5}
           text = {formatCurrent(solverResults.branch_current[component.id])}
           fontSize={12}
           fill='blue'
           />
        )}

          </Fragment>)}
          if (component.type === "voltage_source"){
            return(<Fragment key={component.id}>
              <Image  image = {voltageImg} x = {midX} y = {midY} width={60} height={60} rotation={angle + 180} offsetX={30} offsetY={30}/>
              <Line  points={[from.x, from.y, midX, midY-30]} stroke = "black" strokeWidth={2}/>
              <Line  points={[midX, midY+30, to.x, to.y]} stroke = "black" strokeWidth={2}/>
          </Fragment>)}
          
          return <Line key ={component.id} points={[from.x, from.y,to.x, to.y]} stroke = "black" strokeWidth={2}/>
        })}
        {Object.entries(nodePosition).map(([name,pos]) => {
          if (name === "gnd" || name === "gnd2"){
            return <Image key={name} image = {groundImg} x = {pos.x} y = {pos.y} width={60} height={60} offsetX={30} offsetY={30}/>
          }

        return(<Fragment key={name}>
        <Circle key ={name} x={pos.x} y = {pos.y} radius={5} fill = "black"/>
        {solverResults && solverResults.node_voltages[name] !== undefined &&(
          <Text
           x={pos.x + 8}
           y={pos.y-16}
           text = {formatVoltage(solverResults.node_voltages[name])}
           fontSize={12}
           fill='blue'
           />
        )}
        </Fragment>)
})}
        <Line points={[200, 100,400, 100]} stroke = "black" strokeWidth={2}/>

    </Layer>
  </Stage>
  </>
  )
}

export default App