import {useState} from "react"
export default function Panel({isOpen, onCanvasUpdate})
{
    const [stage, setStage] = useState("input")
    const [prompt, setPrompt] = useState("")
    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({})
    if (!isOpen) return null
    async function handleSubmit(){
        const response = await fetch("http://localhost:8000/generate",{
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({prompt}) 
        })
        const data = await response.json()
        console.log("backend response: ", JSON.stringify(data, null, 2))
        if (data.status === "needs_clarification"){
            setQuestions(data.questions)
            setStage("clarifying")
        }
        else if (data.status === "success"){
            onCanvasUpdate(data.canvas_state.components)
            setStage("success")
        }
    }
    async function handleClarifySubmit(){
        const response = await fetch("http://localhost:8000/generate",{
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({prompt, answers, skip_clarifications: true})
        })
        const data = await response.json()

        if (data.status === "success"){
            onCanvasUpdate(data.canvas_state.components)
            setStage("success")
        }
    }

    return (
        <div style={
        {
            position: "fixed",
            top: 0,
            right: 0,
            width: "320px",
            height: "100vh",
            background: "white",
            borderLeft: "1px solid #ddd",
            padding: "24px",
            zIndex:10
        }}>
            {stage === "input" && (
                <div>
                    <h2 style={{marginBottom: "12px"}}>Describe your circuit</h2>
                    <textarea
                        rows = {4}
                        style ={{width: "100%", padding: "8px", fontSize:"14px"}}
                        placeholder="e.g voltage divider with 5V source, 10k and 20k resistors"
                        value={prompt}
                        onChange={(e)=> setPrompt(e.target.value)}
                    />
                    <button 
                    onClick={handleSubmit}
                    style ={{marginTopc: "12px", padding: "8px 16px"}}>
                        Generate
                    </button>
                </div>
            )}
            {stage === "clarifying" && (
                <div>
                    <h2 style={{marginBottom: "12px"}}>A few questions</h2>
                    {
                    questions.map((q,i) =>(

                        <div key={i} style={{marginBottom: "16px"}}>
                        <p style={{marginBottom: "8px"}}>{q.question}</p>
                        {q.options.map((option,j)=>(
                            <button key={j} onClick={() =>{
                                setAnswers({ ...answers,[q.question]:option })
                            }}
                            style={{
                                display: "block",
                                marginBottom: "6px",
                                padding: "6px 12px",
                                background: answers[q.question] === option ? "#333":"#fff",
                                color: answers[q.question] === option ? "#fff":"#333",
                                border:"1px solid #333",
                                cursor: "pointer"
                            }}>
                                {option}
                            </button>
                        ))}
                        </div>
                    ))}
                <button 
                onClick={handleClarifySubmit}
                style={{marginTop: "12px", padding:"8px 16px"}}>
                    Submit
                </button>
                </div>
            )}
            {stage === "success" && (
                <div>
                    <h2 style = {{marginBottom: "12px"}}>Circuit generated</h2>
                    <p style ={{color: "#666", marginBottom: "16px"}}>
                        {prompt}
                    </p>
                <button onClick={() => {
                    setStage("input")
                    setPrompt("")
                    setAnswers([])
                    setQuestions([])
                }}style = {{padding: "8px 16px"}}>Generate another</button>
                </div>
            )}
        </div>
    )
}