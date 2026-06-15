import { useState, Fragment} from 'react'
import {Stage, Layer, Circle, Line, Image, Text} from 'react-konva'
import useImages from './hooks/useImages'
import useDrag from './hooks/useDrag'
import useSolver from './hooks/useSolver'
import Panel from './Panel'
const grid_size = 50
const canvas_width = window.innerWidth -320
const canvas_height = window.innerHeight


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


function App() {
  const [components, setComponents] = useState([])
  const images = useImages()
  const {panOffset, handleMouseDown, handleMouseMove, handleMouseUp} = useDrag()
  const solverResults = useSolver(components)
  const [isPanelOpen, setisPanelOpen] = useState(true)

  const nodePosition = {}
  const groundPositions = []


  components.forEach(component => {
    if (!component.nodes || component.nodes.length <2) return
    const fromNode = component.nodes[0]
    const toNode = component.nodes[1]
    if(fromNode === "gnd"){
      groundPositions.push(component.from)
    }
    else if (!nodePosition[fromNode])
      {nodePosition[fromNode] = component.from}
    if (toNode === "gnd"){
      groundPositions.push(component.to)
    }
    else if(!nodePosition[toNode])
      {nodePosition[toNode] = component.to}
  })
  const gridOffsetX = panOffset.x % grid_size
  const gridOffsetY = panOffset.y % grid_size
  return(
  <>
  <Stage width={canvas_width} height ={canvas_height} style={{background: 'white'}}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}>
      <Layer>
      {  
      Array.from({length:canvas_width/grid_size}, (_,i)=> i * grid_size).map(
      vertical => 
        (
      (<Line key ={`v-${vertical}`} points={[vertical+gridOffsetX, 0,vertical + gridOffsetX, canvas_height]} stroke = "#ddd" strokeWidth={1}/>)
        )
      )
      }
      {  Array.from({length:canvas_height/grid_size}, (_,i)=> i * grid_size).map(
        horizontal => (
          (<Line key ={`h-${horizontal}`} points={[0, horizontal + gridOffsetY,canvas_width, horizontal + gridOffsetY]}stroke = "#ddd" strokeWidth={2}/>)
        )
      )}</Layer>
    <Layer x={panOffset.x}y={panOffset.y}>
        {components.map(
          component => {
          if (!component.from || !component.to || !component.nodes) return null
          const from = component.from
          const to  = component.to
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) /2
          const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180/Math.PI)

            const dx = to.x - from.x
            const dy = to.y - from.y
            const length = Math.sqrt(dx*dx + dy*dy)
            const ux = dx/length
            const uy = dy / length

            const lead1 = {x: midX - ux * 30, y: midY-uy * 30}
            const lead2 = {x: midX + ux * 30, y: midY + uy * 30}

          if (component.type === "resistor"){
            return(<Fragment key={component.id}>
              <Image  image = {images.resistor} x = {midX} y = {midY} width={60} height={60} rotation={angle} offsetX={30} offsetY={30}/>
              <Line  points={[from.x, from.y, lead1.x, lead1.y]} stroke = "black" strokeWidth={2}/>
              <Line  points={[lead2.x, lead2.y, to.x, to.y]} stroke = "black" strokeWidth={2}/>
          {solverResults &&solverResults.branch_current &&solverResults.branch_current[component.id] !== undefined &&(
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
              <Image  image = {images.voltage_source} x = {midX} y = {midY} width={60} height={60} rotation={angle + 180} offsetX={30} offsetY={30}/>
              <Line  points={[from.x, from.y, lead1.x, lead1.y]} stroke = "black" strokeWidth={2}/>
              <Line  points={[lead2.x, lead2.y, to.x, to.y]} stroke = "black" strokeWidth={2}/>
          </Fragment>)}
          
          return <Line key ={component.id} points={[from.x, from.y,to.x, to.y]} stroke = "black" strokeWidth={2}/>
        })}
        {Object.entries(nodePosition).map(([name,pos]) => (
          <Fragment key={name}>
            <Circle key ={name} x={pos.x} y = {pos.y} radius={5} fill = "black"/>
          {solverResults && solverResults.node_voltages &&solverResults.node_voltages[name] !== undefined &&(
              <Text
                  x={pos.x + 8}
                  y={pos.y-16}
                  text = {formatVoltage(solverResults.node_voltages[name])}
                  fontSize={12}
                  fill='blue'
           />
        )}
        </Fragment>
))}
{groundPositions.map((pos,i) => (
  <Image key={`gnd-${i}`}image = {images.ground} x = {pos.x} y={pos.y} width={60} height ={60} offsetX={30} offsetY={30}/>
))}

    </Layer>
  </Stage>
  <Panel
  isOpen={isPanelOpen}
  onCanvasUpdate={setComponents}
  />
  </>
  )
}

export default App