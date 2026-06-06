from backend.solver import parser as netlist_parser
from backend.solver import solver as netlist_solver
from pydantic import BaseModel
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_methods = ["*"],
    allow_headers = ["*"]
)

class NetlistInput(BaseModel):
    nodes: list[str]
    components: list[dict[str, Any]]


@app.get("/")
def root():
    return {"status":"Circuit AI backend is running"}

@app.post("/validate")
def validate(netlist: NetlistInput):
    try:
        data = netlist.model_dump()
        netlist_parser.validate_netlist(data)
        return {"valid": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail = {"valid": False, "error":str(e)})
@app.post("/solve")
def solve(netlist: NetlistInput):
    try:
        data = netlist.model_dump()
        netlist_parser.validate_netlist(data)
        solved = netlist_solver.solve_from_data(data)
        results = netlist_solver.result(
            solved["x"],
            solved["node_map"],
            solved["voltage_map"],
            solved["components"]
            )
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail = f"solver error: {str(e)}")
    
