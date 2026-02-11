export interface Publication {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  tags: string[];
  links: { label: string; href: string }[];
  bibtex: string;
  abstract?: string;
  highlight?: boolean;
}

export const publications: Publication[] = [
  {
    id: 'metric-misspecification-2025',
    title: 'When Identifiability Metrics Lie: Structural Misspecification in Representation Evaluation',
    authors: 'Your Name, Collaborator A, Collaborator B',
    venue: 'NeurIPS',
    year: 2025,
    tags: ['representation-learning', 'identifiability', 'evaluation'],
    highlight: true,
    links: [
      { label: 'Paper', href: '#' },
      { label: 'Code', href: 'https://github.com/...' },
      { label: 'arXiv', href: 'https://arxiv.org/abs/...' },
    ],
    bibtex: `@inproceedings{yourname2025metric,
  title={When Identifiability Metrics Lie: Structural Misspecification in Representation Evaluation},
  author={Your Name and Collaborator A and Collaborator B},
  booktitle={Advances in Neural Information Processing Systems},
  year={2025}
}`,
    abstract: 'We show that widely used identifiability metrics produce systematic false positives and false negatives even with perfect optimisation, purely due to structural misspecification.',
  },
  {
    id: 'causal-interp-2025',
    title: 'Causal Inference Meets Mechanistic Interpretability',
    authors: 'Your Name, Collaborator C',
    venue: 'ICML',
    year: 2025,
    tags: ['interpretability', 'causal-inference', 'LLMs'],
    highlight: true,
    links: [
      { label: 'Paper', href: '#' },
      { label: 'arXiv', href: 'https://arxiv.org/abs/...' },
    ],
    bibtex: `@inproceedings{yourname2025causal,
  title={Causal Inference Meets Mechanistic Interpretability},
  author={Your Name and Collaborator C},
  booktitle={International Conference on Machine Learning},
  year={2025}
}`,
    abstract: 'We argue that causal inference provides the right framework for interpretability claims and show how causal representation learning operationalises Pearl\'s hierarchy for neural network internals.',
  },
  {
    id: 'example-workshop-2024',
    title: 'An Example Workshop Paper on Disentanglement',
    authors: 'Your Name, Collaborator D, Collaborator E',
    venue: 'ICLR Workshop on Representational Alignment',
    year: 2024,
    tags: ['representation-learning', 'disentanglement'],
    links: [
      { label: 'Paper', href: '#' },
    ],
    bibtex: `@inproceedings{yourname2024example,
  title={An Example Workshop Paper on Disentanglement},
  author={Your Name and Collaborator D and Collaborator E},
  booktitle={ICLR Workshop on Representational Alignment},
  year={2024}
}`,
  },
];

export const allTags = [...new Set(publications.flatMap(p => p.tags))].sort();
