import { Controller } from "../controller/controller.three";
import type { Health } from "../health/health";


export interface EntityLike extends Controller {
    health:Health
}
export interface RelationshipTree {
    attack:{
        attackedPlayer:EntityLike | null,
        attackedEnemy:EntityLike  | null,
        attackedNPC:EntityLike | null
    }
}

type Singleton<T> = T;
export class RelationshipManager {
    private static manager:RelationshipManager;
    private relationships:RelationshipTree = {
        attack: {
            attackedPlayer:null,
            attackedEnemy:null,
            attackedNPC:null
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