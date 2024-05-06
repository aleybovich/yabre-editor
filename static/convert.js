function convertYamlToMermaid(yamlInput) {
    // Parse the YAML input
    var rules = jsyaml.load(yamlInput);

    // Generate the Mermaid code
    var mermaidCode = 'flowchart TD\n';
    var declaredElements = {};
    var metadata = {};

    function generateConditionDeclaration(conditionName, description) {
        if (declaredElements[conditionName]) return "";
        if (description) return `    ${conditionName}{"\`${description}\`"}\n`;
        return ""
    }

    function generateActionDeclaration(actionName, description) {
        if (declaredElements[conditionName]) return "";
        if (description) return `    ${actionName}["\`${description}\`"]\n`;
        return ""
    }

    function generateTerminateDeclaration(terminateName) {
        if (declaredElements[conditionName]) return "";
        return `    ${terminateName}((( )))\n`;
    }

    function generateConnection(from, to, label) {
        if (label) return `    ${from} -->|${label}| ${to}\n`;
        return `    ${from} --> ${to}\n`;
    }

    function generateDecision(conditionName, decision, label) {
        if (!decision || !conditionName) return "";
    
        code = ""
    
        if (decision.action) {
            var actionId = conditionName + `_${label}`;
        
            // add action element declaration; empty if it's already declared
            code += generateActionDeclaration(actionId, decision.description);
        
            // connection from condition to true action
            code += generateConnection(conditionName, actionId, label);
    
            if (decision.next) {
                // connection from action to next condition
                code += generateConnection(actionId, decision.next, label);
            } else if (decision.terminate) {
                var trueTerminateID = conditionName + `_${label}_end`;
                code += generateTerminateDeclaration(trueTerminateID);
                code += generateConnection(actionId, trueTerminateID);
            }
        } else {
            if (decision.next) {
                code += generateConnection(conditionName, decision.next, label);
            } else if (decision.terminate) {
                var trueTerminateID = conditionName + `_${label}_end`;
                code += generateTerminateDeclaration(trueTerminateID);
                code += generateConnection(conditionName, trueTerminateID, label);
            }
        }
    
        return code
    }

    for (var conditionName in rules.conditions) {
        var condition = rules.conditions[conditionName];
        condition.Name = conditionName;

        mermaidCode += generateConditionDeclaration(condition.Name, condition.description);
        mermaidCode += generateDecision(conditionName, condition.true, 'true');
        mermaidCode += generateDecision(conditionName, condition.false, 'false');

        // rememebr metadata
        metadata[conditionName] = { func: condition.Check, type: "condition" };
        if (condition.true && condition.true.action) {
            metadata[conditionName + '_true'] = {func: condition.true.action, type: "action", value: true};
        }
        if (condition.false && condition.false.action) {
            metadata[conditionName + '_false'] = {func: condition.false.action, type: "action", value: false};
        }
    }

    return mermaidCode;
}