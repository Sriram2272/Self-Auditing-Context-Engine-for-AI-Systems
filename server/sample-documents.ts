import { processDocument } from "./rag-pipeline";
import { extractKnowledgeGraph } from "./knowledge-graph";
import { storage } from "./storage";

// Sample documents for demonstration
const sampleDocuments = [
  {
    name: "Introduction to Machine Learning",
    domain: "science",
    content: `# Introduction to Machine Learning

Machine Learning (ML) is a subset of artificial intelligence (AI) that enables systems to learn and improve from experience without being explicitly programmed. The field has revolutionized how we approach complex problems across various domains.

## Types of Machine Learning

### Supervised Learning
Supervised learning uses labeled training data to learn a mapping function from inputs to outputs. Common algorithms include:
- Linear Regression for predicting continuous values
- Decision Trees for classification tasks
- Neural Networks for complex pattern recognition

### Unsupervised Learning
Unsupervised learning finds patterns in unlabeled data. Key techniques include:
- K-Means Clustering for grouping similar data points
- Principal Component Analysis (PCA) for dimensionality reduction
- Autoencoders for feature learning

### Reinforcement Learning
Reinforcement learning trains agents to make decisions by rewarding desired behaviors. Applications include:
- Game playing (AlphaGo, chess engines)
- Robotics and autonomous vehicles
- Resource management and optimization

## Deep Learning

Deep Learning is a subset of machine learning using neural networks with multiple layers. Key architectures include:

### Convolutional Neural Networks (CNNs)
CNNs are particularly effective for image recognition and computer vision tasks. They use convolutional layers to automatically learn spatial hierarchies of features.

### Transformers
Transformers revolutionized natural language processing with the self-attention mechanism. Models like BERT and GPT have achieved state-of-the-art results in language understanding and generation.

## Applications

Machine learning powers many modern technologies:
- Voice assistants (Siri, Alexa)
- Recommendation systems (Netflix, Spotify)
- Medical diagnosis and drug discovery
- Financial fraud detection
- Autonomous vehicles

Geoffrey Hinton, Yann LeCun, and Yoshua Bengio are considered pioneers of deep learning, receiving the Turing Award in 2018 for their contributions.`,
  },
  {
    name: "Climate Change Research Summary",
    domain: "science",
    content: `# Climate Change: Current Understanding and Impacts

Climate change refers to long-term shifts in global temperatures and weather patterns. While natural factors have historically influenced climate, human activities have been the primary driver since the industrial revolution.

## The Greenhouse Effect

The greenhouse effect is a natural process where certain gases trap heat in Earth's atmosphere. Key greenhouse gases include:

- Carbon Dioxide (CO2): Primarily from burning fossil fuels, deforestation
- Methane (CH4): From agriculture, landfills, and natural gas systems
- Nitrous Oxide (N2O): From agricultural practices and industrial processes
- Fluorinated gases: From industrial applications

## Observed Changes

### Temperature Rise
Global average temperatures have risen approximately 1.1°C since pre-industrial times. The Intergovernmental Panel on Climate Change (IPCC) warns that limiting warming to 1.5°C requires rapid, far-reaching changes.

### Sea Level Rise
Sea levels have risen about 20cm since 1900 due to thermal expansion and melting ice. Projections indicate a potential rise of 0.3 to 1.1 meters by 2100.

### Extreme Weather Events
Climate change is linked to increased frequency and intensity of:
- Heat waves and droughts
- Heavy precipitation and flooding
- Tropical cyclones
- Wildfires

## Mitigation Strategies

### Renewable Energy
Transitioning to solar, wind, and hydroelectric power reduces carbon emissions. The International Energy Agency recommends achieving net-zero emissions by 2050.

### Carbon Capture
Technologies to capture and store CO2 from industrial processes and directly from the atmosphere are under development.

### Policy Measures
The Paris Agreement aims to limit global warming to well below 2°C, preferably 1.5°C. Nations submit Nationally Determined Contributions (NDCs) outlining emission reduction targets.

## Economic Impacts

The World Bank estimates climate change could push 132 million people into poverty by 2030. Adaptation costs for developing countries could reach $140-300 billion per year by 2030.`,
  },
  {
    name: "Business Strategy Fundamentals",
    domain: "business",
    content: `# Business Strategy Fundamentals

Business strategy is a set of competitive moves and actions that a business uses to attract customers, compete successfully, strengthen performance, and achieve organizational goals.

## Strategic Analysis Frameworks

### SWOT Analysis
SWOT examines internal Strengths and Weaknesses alongside external Opportunities and Threats. This framework helps organizations understand their competitive position.

### Porter's Five Forces
Michael Porter's framework analyzes industry attractiveness through:
1. Threat of new entrants
2. Bargaining power of suppliers
3. Bargaining power of buyers
4. Threat of substitute products
5. Competitive rivalry

### PESTLE Analysis
This macro-environmental analysis covers Political, Economic, Social, Technological, Legal, and Environmental factors affecting business operations.

## Competitive Strategies

### Cost Leadership
Companies like Walmart and Amazon achieve competitive advantage through operational efficiency and economies of scale, offering products at lower prices than competitors.

### Differentiation
Apple and Tesla differentiate through innovation, design, and brand experience, commanding premium prices for unique value propositions.

### Focus Strategy
Niche players target specific market segments with specialized offerings, such as Rolls-Royce in luxury automobiles or Whole Foods in organic groceries.

## Digital Transformation

### E-commerce Revolution
Digital platforms have transformed retail, with global e-commerce sales exceeding $5 trillion. Companies must develop omnichannel strategies integrating physical and digital experiences.

### Data-Driven Decision Making
Organizations leverage big data and analytics for:
- Customer insight and personalization
- Supply chain optimization
- Predictive maintenance
- Risk management

## Organizational Structure

### Functional Structure
Traditional hierarchy organized by departments (marketing, finance, operations). Suitable for stable environments with standardized products.

### Matrix Structure
Dual reporting relationships balancing functional expertise with project or product focus. Common in consulting firms and technology companies.

### Agile Organization
Cross-functional teams with autonomous decision-making authority. Enables rapid response to market changes and customer needs.

McKinsey, Boston Consulting Group, and Bain are the leading strategic consulting firms advising Fortune 500 companies on business transformation.`,
  },
];

export async function loadSampleDocuments(): Promise<void> {
  // Check if documents already exist
  const existingDocs = await storage.getAllDocuments();
  if (existingDocs.length > 0) {
    console.log("Sample documents already loaded");
    return;
  }

  console.log("Loading sample documents...");

  for (const doc of sampleDocuments) {
    try {
      // Process document for RAG
      const document = await processDocument(doc.name, doc.content, doc.domain, "sample");
      
      // Extract knowledge graph
      await extractKnowledgeGraph(document.id, doc.content);
      
      console.log(`Loaded: ${doc.name}`);
    } catch (error) {
      console.error(`Failed to load ${doc.name}:`, error);
    }
  }

  console.log("Sample documents loaded successfully");
}
