import { Controller } from "../controller/controller.three";
import type { Health } from "../health/health";


interface RelationshipContract extends Controller {
    health:Health
}
export interface RelationshipTree {
    attack:{
        attackedPlayer:RelationshipContract | null,
        attackedEnemy:RelationshipContract  | null
    }
}

type Singleton<T> = T;
export class RelationshipManager {
    private static manager:RelationshipManager;
    private relationships:RelationshipTree = {
        attack: {
            attackedPlayer:null,
            attackedEnemy:null
        }
    }

    private constructor() {};
    public static get instance():RelationshipManager {
        if (!RelationshipManager.manager)  {
            RelationshipManager.manager = new RelationshipManager();
        }
        return RelationshipManager.manager;
    }

    get attackRelationship() {
        return this.relationships.attack
    }
}
export const relationshipManager:Singleton<RelationshipManager> = RelationshipManager.instance;