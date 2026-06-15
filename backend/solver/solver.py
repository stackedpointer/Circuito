from PySpice.Spice.Netlist import Circuit
from PySpice.Unit import *
from backend.solver.parser import parse_netlist
import shutil
ngspice_path = shutil.which('ngspice_con')

def solve_from_data(data):
    nodes = data["nodes"]
    components = data["components"]

    circuit = Circuit('circuit')

    for component in components:
        cid = component["id"]
        ctype = component["type"]
        value = component["value"]
        node_p, node_n = component["nodes"]

        if node_p == "gnd":
            n_p = circuit.gnd
        else:
            n_p = node_p
        if node_n == "gnd":
            n_n = circuit.gnd
        else:
            n_n = node_n

        num = cid[1:]
        if ctype =="resistor":
            circuit.R(num,n_p, n_n, value)
        elif ctype == "voltage_source":
            circuit.V(num, n_p, n_n, value)
        elif ctype == "current_source":
            circuit.I(num, n_p, n_n, value)
    simulator = circuit.simulator(simulator = 'ngspice-subprocess')
    analysis = simulator.operating_point()
    node_voltages = {"gnd":0.0}
    for node in nodes:
        if node == "gnd":
            continue
        node_voltages[node] = float(analysis[node])


    source_currents = {}
    for component in components:
        if component["type"] == "voltage_source":
            spice_name = f"v{component['id'][1:]}"
            source_currents[component["id"]] = float(analysis[spice_name])


    branch_current = {}
    power = {}
    for component in components:
        if component["type"] == "resistor":
            node_p, node_n = component["nodes"]
            v_p = node_voltages[node_p]
            v_n = node_voltages[node_n]
            I = (v_p - v_n) / component["value"]
            branch_current[component["id"]] = I
            power[component["id"]] = I ** 2 * component["value"]

    return {
        "node_voltages": node_voltages,
        "source_currents": source_currents,
        "branch_current": branch_current,
        "power": power
    }


def solve(filepath):
    data = parse_netlist(filepath)
    return solve_from_data(data)


if __name__ == "__main__":
    import sys
    import json
    solved = solve(sys.argv[1])
    print(json.dumps(solved, indent=2))