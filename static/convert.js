// yamlToMermaid.js

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['js-yaml'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('js-yaml'));
    } else {
        // Browser globals (root is window)
        root.convertYamlToMermaid = factory(root.jsyaml);
    }
}(typeof self !== 'undefined' ? self : this, function(jsyaml) {

    function convertYamlToMermaid(yamlInput) {
        // Parse the YAML input
        const rules = jsyaml.load(yamlInput);

        // Generate the Mermaid code
        let mermaidCode = 'flowchart TD\n';
        const declaredElements = {};
        const metadata = {};

        function generateConditionDeclaration(conditionName, description) {
            if (declaredElements[conditionName]) return "";
            declaredElements[conditionName] = true;
            return `    ${conditionName}{"\`${sanitize(description) ?? conditionName}\`"}\n`;
        }

        function generateActionDeclaration(actionName, description) {
            if (declaredElements[actionName]) return "";
            declaredElements[actionName] = true;
            return `    ${actionName}["\`${sanitize(description) ?? actionName}\`"]\n`;
        }

        function generateTerminateDeclaration(terminateName) {
            if (declaredElements[terminateName]) return "";
            declaredElements[terminateName] = true;
            return `    ${terminateName}((( )))\n`;
        }

        function generateConnection(from, to, label) {
            return label ? `    ${from} -->|${label}| ${to}\n` : `    ${from} --> ${to}\n`;
        }

        function generateDecision(conditionName, decision, label) {
            if (!decision || !conditionName) return "";
        
            let code = "";
        
            if (decision.action) {
                const actionId = conditionName + `_${label}`;
            
                code += generateActionDeclaration(actionId, decision.description);
                code += generateConnection(conditionName, actionId, label);
        
                if (decision.next) {
                    code += generateConnection(actionId, decision.next, label);
                } else if (decision.terminate) {
                    const terminateId = conditionName + `_${label}_end`;
                    code += generateTerminateDeclaration(terminateId);
                    code += generateConnection(actionId, terminateId);
                }
            } else {
                if (decision.next) {
                    code += generateConnection(conditionName, decision.next, label);
                } else if (decision.terminate) {
                    const terminateId = conditionName + `_${label}_end`;
                    code += generateTerminateDeclaration(terminateId);
                    code += generateConnection(conditionName, terminateId, label);
                }
            }
        
            return code;
        }

        for (const conditionName in rules.conditions) {
            const condition = rules.conditions[conditionName];
            condition.Name = conditionName;

            mermaidCode += generateConditionDeclaration(condition.Name, condition.description);
            mermaidCode += generateDecision(conditionName, condition.true, 'true');
            mermaidCode += generateDecision(conditionName, condition.false, 'false');

            // remember metadata
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

    function sanitize(input) {
        return !input ? input : input.replaceAll(`"`, "&ampquot");
    }

    return convertYamlToMermaid;
}));