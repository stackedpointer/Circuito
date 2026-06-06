from backend.solver.parser import parse_netlist
import numpy as np

def build_node_map(nodes):
    node_dict = dict()
    counter = 0
    for node in nodes:
        if node == "gnd":
            continue
        node_dict[node] = counter
        counter +=1
    return node_dict
def build_vs_map(components, N):
    voltage_dict = dict()
    for component in components:
        if component["type"] == "voltage_source":
            voltage_dict[component["id"]] = N
            N+=1
    return voltage_dict
def stamp_resistor(A, b, node_map, component):
    node1, node2 = component["nodes"]
    g = 1/ component["value"]
    i = node_map.get(node1)
    j = node_map.get(node2)
    if i is not None:
        A[i][i] += g
    if j is not None:
        A[j][j] += g
    if i is not None and j is not None:
        A[i][j] -= g
        A[j][i] -= g
def stamp_voltage_source(A, b, node_map, vs_map, component):
    node_p, node_n = component["nodes"]
    k = vs_map[component["id"]]
    p = node_map.get(node_p)
    n = node_map.get(node_n)
    if p is not None:
        A[p][k] += 1
        A[k][p] += 1
    if n is not None:
        A[n][k] -= 1
        A[k][n] -= 1
    b[k] = component["value"]
def stamp_current_source(A, b, node_map, component):
    node_p, node_n = component["nodes"]
    p = node_map.get(node_p)
    n = node_map.get(node_n)
    I = component["value"]
    if p is not None:
        b[p] +=I
    if n is not None:
        b[n] -=I
def solve(filepath):
    data = parse_netlist(filepath)
    nodes = data["nodes"]
    node_map = build_node_map(nodes)
    components = data["components"]
    voltage_map = build_vs_map(components, len(node_map))
    size = len(node_map) + len(voltage_map)
    A = np.zeros((size, size))
    b = np.zeros(size)
    for component in  components:
        if component["type"] == "resistor":
            stamp_resistor(A, b, node_map, component)
        elif component["type"] == "voltage_source":
            stamp_voltage_source(A, b, node_map,voltage_map, component)
        elif component["type"] == "current_source":
            stamp_current_source(A, b, node_map, component)
    try:
        x = np.linalg.solve(A,b)
    except np.linalg.LinAlgError:
        raise ValueError("circuit is singular - check for floating nodes or volatge source loops")
    return {
    "x": x,
    "node_map": node_map,
    "voltage_map": voltage_map,
    "components": components
}
def solve_from_data(data):
    nodes = data["nodes"]
    components = data["components"]
    node_map = build_node_map(nodes)
    voltage_map = build_vs_map(components, len(node_map))
    size = len(node_map) + len(voltage_map)
    A = np.zeros((size, size))
    b = np.zeros(size)
    for component in components:
        if component["type"] == "resistor":
            stamp_resistor(A, b, node_map, component)
        elif component["type"] == "voltage_source":
            stamp_voltage_source(A, b, node_map, voltage_map, component)
        elif component["type"] == "current_source":
            stamp_current_source(A, b, node_map, component)
    try:
        x = np.linalg.solve(A, b)
    except np.linalg.LinAlgError:
        raise ValueError("circuit is singular - check for floating nodes or voltage source loops")
    return {
        "x": x,
        "node_map": node_map,
        "voltage_map": voltage_map,
        "components": components
    }
def result(x,node_map, voltage_map, components):
    node_voltages = {}
    for name, i in node_map.items():
        node_voltages[name] = x[i]
    node_voltages["gnd"] = 0.0
    source_currents = {}
    for source_id, i in voltage_map.items():
        source_currents[source_id] = x[i]
    current = {}
    power = {}
    for component in components:
        if component["type"] == "resistor":
            node_i, node_j = component["nodes"]
            v_i = node_voltages[node_i]
            v_j = node_voltages[node_j]
            I = (v_i-v_j)/component["value"]
            current[component["id"]] = I
            P = I**2 * component["value"]
            power[component["id"]] = P
    return {"node_voltages": node_voltages,
            "source_currents": source_currents,
            "branch_current": current,
            "power": power}

if __name__ == "__main__":
    import sys
    import json
    filepath = sys.argv[1]
    solved = solve(filepath)
    results = result(solved["x"], solved["node_map"], solved["voltage_map"], solved["components"])
    print(json.dumps(results, indent=2))

