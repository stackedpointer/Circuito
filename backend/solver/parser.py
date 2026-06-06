import json

def load_json(filepath):
    try:
        with open(filepath, "r") as file:
            data = json.load(file)
        return data
    except FileNotFoundError:
        raise ValueError(f"File not found {filepath}")
    except json.JSONDecodeError:
        raise ValueError(f"failed to decode JSON from the file {filepath}.")

def check_top_level(data):
    if not isinstance(data, dict):
        raise ValueError(f"netlist must be a JSON object, got a list")
    if "nodes" not in data:
        raise ValueError(f"Nodes is not in the json")
    if not isinstance(data["nodes"], list):
        raise ValueError(f"nodes must be a list")
    if "components" not in data:
        raise ValueError(f"components is not in the json")
    if not isinstance(data["components"], list):
        raise ValueError(f"components must be a list")

def check_nodes(nodes):
    if "gnd" not in nodes:
        raise ValueError(f"ground is not present")
    for node in nodes:
        if not isinstance(node, str):
            raise ValueError(f"non string value found in nodes")
    if len(nodes) != len(set(nodes)):
        raise ValueError(f"duplicate found in nodes")

def check_component(component, valid_nodes):
    for i in ("id", "type", "value", "nodes"):
        if i not in component:
            raise ValueError("key missing in component")
    if not isinstance(component["id"], str):
        raise ValueError("invalid id, should be string")
    if component["type"] not in ("resistor", "voltage_source", "current_source"):
        raise ValueError("type is not valid")
    if not isinstance(component["value"], (int ,float)):
        raise ValueError("invalid value, should be int or float")
    if component["value"] <= 0:
        raise ValueError("value can't be negative")
    if len(component["nodes"]) != 2:
        raise ValueError("invalid node number")
    for n in component["nodes"]:
        if n not in valid_nodes:
            raise ValueError(f'node "{n}" in component "{component["id"]}" not found in nodes list')

        
def check_components(components, valid_nodes):
    seen = set()
    for component in components:
        check_component(component, valid_nodes)
        if component["id"] in seen:
            raise ValueError(f'duplicated detected in components {component["id"]}')
        seen.add(component["id"])

        
def parse_netlist(filepath):
    data = load_json(filepath)
    check_top_level(data)
    check_nodes(data["nodes"])
    check_components(data["components"],data["nodes"] )
    return data
def validate_netlist(data):
    check_top_level(data)
    check_nodes(data["nodes"])
    check_components(data["components"], data["nodes"])
    return data

if __name__ == "__main__":
    print(parse_netlist("circuits.json"))
