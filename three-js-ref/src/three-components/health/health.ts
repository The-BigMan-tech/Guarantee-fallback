export class Health {
    private maximumHealth: number;
    private currentHealth: number;
    public isDead: boolean = false;

    constructor(maxHealth: number) {
        this.maximumHealth = maxHealth;
        this.currentHealth = maxHealth;
    }
    public takeDamage(amount: number) {
        if (this.isDead) return;
        this.currentHealth -= amount;
        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.die();
        }
    }
    public heal(amount: number) {
        if (this.isDead) return;
        this.currentHealth = Math.min(this.currentHealth + amount, this.maximumHealth);
    }
    public revive() {
        this.currentHealth = this.maxHealth
        this.isDead = false
    }
    private die() {// Trigger death logic like animations, disabling controls, etc.
        this.isDead = true;
    }
    get value() {//for the jotai state
        return this.currentHealth;
    }
    get maxHealth() {//for the jotai state
        return this.maximumHealth;
    }
}
