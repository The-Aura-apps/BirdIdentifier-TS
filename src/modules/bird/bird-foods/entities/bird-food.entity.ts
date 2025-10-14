import { Entity, Index, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Bird } from "../../birds/entities/bird.entity";
import { Food } from "../../foods/entities/food.entity";

@Entity("bird_foods")
@Index(["birdId", "foodId", "season"], { unique: true })
export class BirdFood {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "bird_id" })
    birdId: number;

    @Column({ name: "food_id" })
    foodId: number;

    @ManyToOne(() => Bird, (bird) => bird.foods, { onDelete: "CASCADE" })
    @JoinColumn({ name: "bird_id" })
    bird: Bird;

    @ManyToOne(() => Food, (food) => food.birdFoods, { onDelete: "CASCADE" })
    @JoinColumn({ name: "food_id" })
    food: Food;

    @Column({
        type: "enum",
        enum: ["year-round", "breeding", "winter", "migration"],
        default: "year-round",
    })
    season: string;

    @Column({ type: "smallint", nullable: true })
    percentageOfDiet: number; // 0-100

    @Column({ type: "text", nullable: true })
    notes: string;

    @Column({ type: "boolean", default: false })
    isPrimary: boolean; // Main food source
}