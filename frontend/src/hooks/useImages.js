import { useState, useEffect } from "react"
import resistorPng from '../assets/symbols/resistor.png'
import voltagePng from '../assets/symbols/voltage.png'
import groundPng from '../assets/symbols/ground.png'

export default function useImages() {
    const [images, setImages] = useState({})

    useEffect(() =>{
        const sources =
        {
        resistor : resistorPng,
        voltage_source : voltagePng,
        ground: groundPng
        }
        const loaded = {}
        let loadedCount = 0
        const total = Object.keys(sources).length

        Object.entries(sources).map(([key, src]) =>
        {
            const img = new window.Image()
            img.src = src
            img.onload = () => 
            {
                loaded[key] = img
                loadedCount++
                if (loadedCount === total)
                {
                    setImages(loaded)
                }
            }
        })
    },[])
    return images
}
    
    
    
    
    
    
    
    
    
