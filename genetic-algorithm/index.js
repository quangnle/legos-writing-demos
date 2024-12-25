class Individual {
    constructor(chromosome) {
        this.chromosome = chromosome;
        this.fitnessScore = 0;
    }
}

class GeneticAlgorithm {
    constructor(populationSize, chromosomeLength, mutationRate) {
        this.mutationRate = mutationRate;
        this.population = [];
        for (let i = 0; i < populationSize; i++) {
            this.population.push(new Individual(this.generateRandomChromosome(chromosomeLength)));
        }
    }

    generateRandomChromosome(length) {
        let chromosome = '';
        for (let i = 0; i < length; i++) {
            chromosome += Math.round(Math.random());
        }
        return chromosome;
    }

    calculateFitness(individual, target) {
        let fitness = 0;
        for (let i = 0; i < individual.chromosome.length; i++) {
            if (individual.chromosome[i] === target[i]) {
                fitness++;
            }
        }
        return fitness;
    }

    selection() {       
        // Calculate the sum of all fitness scores
        const sum = this.population.reduce((acc, individual) => acc + individual.fitnessScore, 0);
        const selected = [];
        const numIndividuals = 2;
        for (let i = 0; i < numIndividuals; i++) {
            let random = Math.random() * sum;
            let current = 0;
            // Select an individual based on the fitness score            
            for (let j = 0; j < this.population.length; j++) {
                // Add the fitness score of the current individual
                current += this.population[j].fitnessScore;
                // until the sum is greater than the random value
                // the individual is selected
                if (random <= current) {
                    selected.push(this.population[j]);
                    break;
                }
            }
        }
        return selected;
    }

    crossover(parent1, parent2) {
        // Randomly select a split point
        const splitPoint = Math.floor(Math.random() * parent1.chromosome.length);
        // Create two children by combining the parents
        // and swapping the chromosome parts        
        const child1 = new Individual(parent1.chromosome.slice(0, splitPoint) + parent2.chromosome.slice(splitPoint));
        const child2 = new Individual(parent2.chromosome.slice(0, splitPoint) + parent1.chromosome.slice(splitPoint));
        return [child1, child2];
    }

    mutation(individual) {
        let chromosome = '';
        for (let i = 0; i < individual.chromosome.length; i++) {
            // Flip the bit with a probability of mutationRate
            if (Math.random() < this.mutationRate) {
                chromosome += individual.chromosome[i] === '0' ? '1' : '0';
            } else {
                chromosome += individual.chromosome[i];
            }
        }
        individual.chromosome = chromosome;
    }

    evolve(target) {
        // Calculate the fitness score for each individual
        this.population.forEach(individual => individual.fitnessScore = this.calculateFitness(individual, target));        
        // Select two individuals from the population
        const selected = this.selection();
        // Perform crossover
        const children = this.crossover(selected[0], selected[1]);
        // Perform mutation
        this.mutation(children[0]);
        this.mutation(children[1]);
        // Calculate the fitness score for the children
        children[0].fitnessScore = this.calculateFitness(children[0], target);
        children[1].fitnessScore = this.calculateFitness(children[1], target);        
        // sort the population by fitness score
        this.population.sort((a, b) => a.fitnessScore - b.fitnessScore);
        // Replace the two worst individuals with
        // the two children
        this.population[0] = children[0];
        this.population[1] = children[1];
    }
}

const ga = new GeneticAlgorithm(100, 100, 0.05);
const target = ga.generateRandomChromosome(100);

let generation = 0;
while (generation < 1000000) {
    generation++;
    ga.evolve(target);
    const best = ga.population.reduce((acc, individual) => individual.fitnessScore > acc.fitnessScore ? individual : acc);
    if (generation % 100 === 0) {
        console.log(`Generation: ${generation}, Best: ${best.fitnessScore}`);
    }
    if (best.fitnessScore === target.length) {
        console.log(`Generation: ${generation}, Target: ${target}, Best: ${best.chromosome}`);
        break;
    }
}