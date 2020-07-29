import { RollHandler } from "../rollHandler.js"
import * as settings from "../../settings.js";

export class RollHandlerBase5e extends RollHandler {
    constructor() {
        super();
    }

    /** @override */
    doHandleActionEvent(event, encodedValue) {
        let payload = encodedValue.split('|');
        
        if (payload.length != 3) {
            super.throwInvalidValueErr();
        }
        
        let macroType = payload[0];
        let tokenId = payload[1];
        let actionId = payload[2];

        if (this.handleCompendiums(macroType, event, tokenId, actionId))
            return;

        switch (macroType) {
            case "ability":
                this.rollAbilityMacro(event, tokenId, actionId);
                break;
            case "skill":
                this.rollSkillMacro(event, tokenId, actionId);
                break;
            case "abilitySave":
                this.rollAbilitySaveMacro(event, tokenId, actionId);
                break;
            case "abilityCheck":
                this.rollAbilityCheckMacro(event, tokenId, actionId);
                break;
            case "item":
            case "spell":
            case "feat":
                this.rollItemMacro(event, tokenId, actionId);
                break;
            case "utility":
                this.performUtilityMacro(event, tokenId, actionId);
            default:
                break;
        }
    }
    
    rollAbilityMacro(event, tokenId, checkId) {
        super.getActor(tokenId).rollAbility(checkId, {event: event});
    }
    
    rollAbilityCheckMacro(event, tokenId, checkId) {
        super.getActor(tokenId).rollAbilityTest(checkId, {event: event});
    }

    rollAbilitySaveMacro(event, tokenId, checkId) {
        super.getActor(tokenId).rollAbilitySave(checkId, {event: event});
    }
    
    rollSkillMacro(event, tokenId, checkId) {
        super.getActor(tokenId).rollSkill(checkId, {event: event});
    }
    
    rollItemMacro(event, tokenId, itemId) {
        let actor = super.getActor(tokenId);
        let item = actor.getOwnedItem(itemId);

        if (this.needsRecharge(item)) {
            item.rollRecharge();
            return;
        }

        
        if (item.data.type === "spell")
            return actor.useSpell(item);
            
        return item.roll();
    }

    needsRecharge(item) {
        return (item.data.data.recharge && !item.data.data.recharge.charged && item.data.data.recharge.value);
    }
    
    performUtilityMacro(event, tokenId, actionId) {
        let actor = super.getActor(tokenId);
        let token = super.getToken(tokenId);

        switch(actionId) {
            case 'shortRest':
                actor.shortRest();
                break;
            case 'longRest':
                actor.longRest();
                break;
            case 'inspiration':
                let update = !actor.data.data.attributes.inspiration;
                actor.update({"data.attributes.inspiration": update});
                break;
            case 'toggleCombat':
                token.toggleCombat();
                Hooks.callAll('forceUpdateTokenActionHUD')
                break;
            case 'toggleVisibility':
                token.toggleVisibility();
                break;
            case 'deathSave':
                actor.rollDeathSave();
                break;
        }
    }
}