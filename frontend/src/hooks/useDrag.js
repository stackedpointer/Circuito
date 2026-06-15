import { useState, useRef } from "react"

export default function useDrag() 
{
    const [panOffset, setPanOffset] = useState({x:0, y: 0})
    const dragStart = useRef(null)

    function handleMouseDown(e)
    {
        if (e.target !== e.target.getStage()) return
        const pos = e.target.getStage().getPointerPosition()
        dragStart.current = {x: pos.x - panOffset.x, y:pos.y - panOffset.y}
    }
    function handleMouseMove(e)
    {
        if (!dragStart.current) return
        const pos = e.target.getStage().getPointerPosition()
        setPanOffset(
        {
            x: pos.x - dragStart.current.x,
            y: pos.y - dragStart.current.y
        })
    }
    function handleMouseUp(){
        dragStart.current = null
    }
    return {panOffset, handleMouseDown, handleMouseMove, handleMouseUp}

}