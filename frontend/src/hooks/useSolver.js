import { useState, useEffect } from "react"

export default function useSolver(components){
    const [solverResults, setSolverResults] = useState(null)

    useEffect(()=>{
        if (components.length === 0) return

        async function runSolver(){
            const netlist = 
            {
                nodes: [...new Set(components.flatMap(c => c.nodes))],
                components: components
                    .filter(c => c.type !== "wire")
                    .map(({id, type, value, nodes})=>({id, type, value, nodes}))
            }
            const response = await fetch("http://localhost:8000/solve",{
                method: "POST",
                headers:{"Content-Type": "application/json"},
                body: JSON.stringify(netlist)
            })
            if  (!response.ok) {
                console.error("solver failed:", await response.text())
                return
            }
            const data = await response.json()
            setSolverResults(data)
        }
        runSolver()},[components])
        return solverResults

    }







