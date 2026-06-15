import os
from openai import OpenAI
from dotenv import load_dotenv
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("AIAPI"))

def clarify(prompt):
    response = client.chat.completions.create(
    model = "gpt-4.1-nano",
    messages = [{
         "role":"system",
         "content": """You are a circuit design assistant. Your job is to decide if a user's 
         circuit description is specific enough to build from. 
         
         if it IS specific enough, respond with exactly this JSON:
         
         {"clear": true, "questions": []}

         if it is NOT specific enough, responf with exactly this JSON:
         {"clear": false, "questions": [
         {
         
         "question": "your question here",
         "options": ["option1", "option2", "option3"]
         }
         ]}
        Rules:
        - respond with raw JSON only, no markdown, no explanation, no backticks.
        -Ask only what is necessary to build the circuit. Do not ask for information you can assume reasonably. 
        - each question must have 2-4 options. 
        -maximum 3 questions at once."""
     },
     {"role": "user",
      "content": prompt}]
    )

    raw = response.choices[0].message.content.strip()
    return json.loads(raw)


def think(prompt, answers = None):
    full_prompt = prompt
    if answers:
        clarifications = []
        for q, a in answers.items():
            clarifications.append("- " + q + ": " + a)
        full_prompt += "\n\nUser clarifications:\n" + "\n".join(clarifications)
    response = client.chat.completions.create(
        model = "gpt-4.1-nano",
        messages=[
            {
                "role": "system",
                "content": """You are a circuit design assistant. Given a circuit description, produce a structured design spec and in the description you must be elaborative on how the circuit looks and how much gaps there are between each element
                and node placement so the builder agent who plots the coordinates for the components on a campus can understand how the circuit looks.
                Respond with exactly this JSON:
                {
                "circuit_name":"short name",
                "description": "what this circuit does in one sentence",
                "components":[
                {
                "id":"R1",
                "type": "resistor",
                "value": 10000,
                "unit":"ohms",
                "label":"R1 10KΩ"
                }
                ],           
                "nodes": ["gnd", "n1","n2"],
                "connections":[
                {"from":"n1","to":"n2","via":"R1"}
                ]
                }
                Rules:
                - Respond with raw JSON only. No markdown, no explanation, no backticks.
                - Supported component types: resistor, voltage_source, current_source
                - Node named "gnd" is always ground reference
                - Values always in SI base units: ohms, volts, amps
                - Every component must connect to at least one non-gnd node
                -connections describe topology only, no coordinates
                - The circuit must form at least one closed loop: every non-ground node must appear in exactly two connections (or more, for branching), and the topology must trace back to "gnd" through some path.
                - For a simple series circuit (voltage divider, single loop), the connections must form a cycle: gnd -> n1 -> ... -> nX -> gnd
                - The voltage source's connections list must include one connection to "gnd"
                - Do not introduce a node name equal to a component id (e.g. never use "V1" as a node name)
                """
                },
                {
                    "role":"user",
                    "content": full_prompt
                }])
    raw  = response.choices[0].message.content.strip()
    return json.loads(raw)



def build(spec):
    response = client.chat.completions.create(
        model = "gpt-4.1-nano",
        messages=[
            {
                "role": "system",
                "content": """You are a circuit layout engine. Given a circuit spec, assign canvas coordinates to every component.

                    Respond with exactly this JSON:
                    {
                    "nodes": ["gnd", "n1", "n2"],
                    "components": [
                        {
                        "id": "R1",
                        "type": "resistor",
                        "value": 10000,
                        "nodes": ["n1", "n2"],
                        "label": "R1 10kΩ",
                        "from": {"x": 200, "y": 100},
                        "to": {"x": 400, "y": 100}
                        }
                    ]
                    }

                    CRITICAL: Every component object MUST have ALL of these fields: id, type, value, nodes, label, from, to.
                    The "nodes" field on each component is a list of exactly two node names e.g. ["n1", "gnd"].
                    Copy nodes, id, type, value, label exactly from the input spec. Do not drop any fields.

                    Layout rules:
                    - Grid size is 100px. ALL coordinates must be multiples of 100.
                    - Components are horizontal or vertical only. Never diagonal.
                    - Horizontal component: from.y == to.y, from.x != to.x
                    - Vertical component: from.x == to.x, from.y != to.y
                    - Minimum component length is 200px (4 grid cells)
                    - Use a two-rail layout: left rail x=200, right rail x=800
                    - Voltage sources go on the left rail, vertical
                    - Resistors go on the top rail, horizontal
                    - Ground is always at y=500
                    - Start coordinates at x=200, y=100
                    - Space components 200px apart
                    - Never overlap two components
                    - Every component needs both "from" and "to"

                    Rules:
                    - Respond with raw JSON only. No markdown, no explanation, no backticks.
                    - Always include "gnd" in nodes list
                    - Never use a component id (e.g. "V1", "R1") as a node name in the "nodes" field. Node names must come only from the input spec's "nodes" list.
                    - Every component's "nodes" array must contain exactly 2 entries, both of which exist in the top-level "nodes" list.
                    - "gnd" must appear in at least one component's "nodes" array.
                    """
},
              
              {
                  "role":"user",
                  "content": json.dumps(spec)
              }
            ]
          )
    raw = response.choices[0].message.content.strip()
    return json.loads(raw)

if __name__ == "__main__":
    spec = think("voltage divider with 10k and 5k resistor at 5V")
    result = build(spec)
    print(json.dumps(result, indent = 2))
              
              
              
              


    











