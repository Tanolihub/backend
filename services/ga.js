/**
 * GENETIC ALGORITHM SERVICE (Digital Hakim)
 * 
 * Ye file hamary chatbot ka "Dimaag" hai jo best response select karti hai.
 * It evolves a population of responses to find the most relevant one.
 */

export class GeneticAlgorithmService {
  constructor(query, options = {}) {
    this.query = query.toLowerCase(); // User ka sawal
    this.populationSize = options.populationSize || 5; // Kitny candidates ko aik sath check karna hai
    this.generations = options.generations || 2; // Kitni baar logic ko refine (evolve) karna hai
    this.mutationRate = options.mutationRate || 0.1; // Random tabdeeli ki sharah
  }

  /**
   * 1. FITNESS FUNCTION: Ye check karta hai k response kitna acha hai.
   * Score jitna zyada hoga, response utna hi relevant hoga.
   */
  calculateFitness(individual) {
    const text = individual.content.toLowerCase();
    
    // A. Keyword Matching: Kya sawal k words response ma hain?
    const queryKeywords = this.query.split(/\s+/).filter(w => w.length > 3);
    let keywordMatches = 0;
    queryKeywords.forEach(word => {
      if (text.includes(word)) keywordMatches++;
    });
    const relevanceScore = queryKeywords.length > 0 ? keywordMatches / queryKeywords.length : 0;

    // B. Symptom Matching: Kya mareez ki alamat (symptoms) match ho rahi hain?
    let symptomScore = 0;
    if (individual.symptoms && individual.symptoms.length > 0) {
      const matchedSymptoms = individual.symptoms.filter(s => this.query.includes(s.toLowerCase()));
      symptomScore = matchedSymptoms.length / individual.symptoms.length;
    }

    // C. Quality Scores: Confidence or Helpfulness (from DB)
    const qualityScore = ((individual.confidence || 0) + (individual.helpfulness || 0)) / 2;

    // Final Score Calculation (Weighted)
    // 50% Keywords, 30% Symptoms, 20% Base Quality
    return (relevanceScore * 0.5) + (symptomScore * 0.3) + (qualityScore * 0.2);
  }

  /**
   * 2. SELECTION: Best parents ko pick karna ta k naye responses ban saken.
   */
  select(population) {
    const totalFitness = population.reduce((sum, ind) => sum + ind.fitness, 0);
    if (totalFitness === 0) return population[Math.floor(Math.random() * population.length)];
    
    let pick = Math.random() * totalFitness;
    let current = 0;
    for (const individual of population) {
      current += individual.fitness;
      if (current >= pick) return individual;
    }
    return population[0];
  }

  /**
   * 3. CROSSOVER: Do achay responses ko mila kar aik naya (behtar) response banana.
   */
  crossover(parent1, parent2) {
    const s1 = parent1.content.split('. ');
    const s2 = parent2.content.split('. ');
    
    const mid1 = Math.floor(s1.length / 2);
    const mid2 = Math.floor(s2.length / 2);
    
    // Dono parents ka aadha aadha hissa mila kar child banaya
    const childContent = [...s1.slice(0, mid1), ...s2.slice(mid2)].join('. ');
    
    return {
      content: childContent,
      symptoms: [...new Set([...(parent1.symptoms || []), ...(parent2.symptoms || [])])],
      confidence: (parent1.confidence + parent2.confidence) / 2,
      helpfulness: (parent1.helpfulness + parent2.helpfulness) / 2
    };
  }

  /**
   * 4. MUTATION: Kabhi kabhi random change lana ta k result boring na ho.
   */
  mutate(individual, originalPool) {
    if (Math.random() < this.mutationRate) {
      const sentences = individual.content.split('. ');
      if (sentences.length > 0) {
        const randomIdx = Math.floor(Math.random() * sentences.length);
        const randomReplacement = originalPool[Math.floor(Math.random() * originalPool.length)].content.split('. ')[0];
        sentences[randomIdx] = randomReplacement;
        individual.content = sentences.join('. ');
      }
    }
    return individual;
  }

  /**
   * 🚀 MAIN EVOLUTION PROCESS: Ye poora GA chalata hai.
   */
  async evolve(candidates) {
    if (!candidates || candidates.length === 0) return null;

    // Sab se pehly population initialize karo or fitness check karo
    let population = candidates.map(c => ({
      content: c.content,
      symptoms: c.symptoms || [],
      confidence: c.confidence || 0.5,
      helpfulness: c.helpfulness || 0.5,
      fitness: this.calculateFitness(c)
    }));

    // Generations chalana (Evolving process...)
    for (let g = 0; g < this.generations; g++) {
      const nextGeneration = [];

      for (let i = 0; i < this.populationSize; i++) {
        // Step 1: Selection
        const p1 = this.select(population);
        const p2 = this.select(population);
        
        // Step 2: Crossover
        let child = this.crossover(p1, p2);
        
        // Step 3: Mutation
        child = this.mutate(child, candidates);
        
        // Step 4: Fitness update
        child.fitness = this.calculateFitness(child);
        
        nextGeneration.push(child);
      }
      population = nextGeneration;
    }

    // Aakhir ma sab se fit response return karo (Sorted by high fitness)
    population.sort((a, b) => b.fitness - a.fitness);
    return population[0];
  }
}
