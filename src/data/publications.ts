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
    id: 'joshi2026causalitykeyinterpretabilityclaims',
    title: 'Causality is Key for Interpretability Claims to Generalise',
    authors: 'Shruti Joshi, Aaron Mueller, David Klindt, Wieland Brendel, Patrik Reizinger, Dhanya Sridhar',
    venue: 'arXiv preprint',
    year: 2025,
    tags: ['interpretability', 'causal-representation-learning', 'sparse-autoencoders', 'generalisation', 'analysis'],
    highlight: true,
    links: [
      { label: 'arXiv', href: 'https://arxiv.org/abs/2602.16698' },
    ],
    bibtex: `@misc{joshi2026causalitykeyinterpretabilityclaims,
      title={Causality is Key for Interpretability Claims to Generalise},
      author={Shruti Joshi and Aaron Mueller and David Klindt and Wieland Brendel and Patrik Reizinger and Dhanya Sridhar},
      year={2026},
      eprint={2602.16698},
      archivePrefix={arXiv},
      primaryClass={cs.LG},
      url={https://arxiv.org/abs/2602.16698},
}`,
    abstract: 'Interpretability research on large language models (LLMs) has yielded important insights into model behaviour, yet recurring pitfalls persist: findings that do not generalise, and causal interpretations that outrun the evidence. Our position is that causal inference specifies what constitutes a valid mapping from model activations to invariant high-level structures, the data or assumptions needed to achieve it, and the inferences it can support. Specifically, Pearl\'s causal hierarchy clarifies what an interpretability study can justify. Observations establish associations between model behaviour and internal components. Interventions (e.g., ablations or activation patching) support claims how these edits affect a behavioural metric (\eg, average change in token probabilities) over a set of prompts. However, counterfactual claims -- i.e., asking what the model output would have been for the same prompt under an unobserved intervention -- remain largely unverifiable without controlled supervision. We show how causal representation learning (CRL) operationalises this hierarchy, specifying which variables are recoverable from activations and under what assumptions. Together, these motivate a diagnostic framework that helps practitioners select methods and evaluations matching claims to evidence such that findings generalise.',
  },
  {
    id: 'joshi2025identifiable',
    title: 'Identifiable steering via sparse autoencoding of multi-concept shifts',
    authors: 'Shruti Joshi, Andrea Dittadi, Sébastien Lachapelle, Dhanya Sridhar',
    venue: 'arXiv preprint',
    year: 2025,
    tags: ['interpretability', 'causal-representation-learning', 'sparse-autoencoders', 'method'],
    highlight: true,
    links: [
      { label: 'arXiv', href: 'https://arxiv.org/abs/2502.12179' },
      { label: 'code', href: 'https://github.com/shrutij01/safecausal'}
    ],
    bibtex: `@article{joshi2025identifiable,
  title={Identifiable steering via sparse autoencoding of multi-concept shifts},
  author={Joshi, Shruti and Dittadi, Andrea and Lachapelle, S{\\'e}bastien and Sridhar, Dhanya},
  journal={arXiv preprint arXiv:2502.12179},
  year={2025}
}`,
    abstract: 'Steering methods manipulate the representations of large language models (LLMs) to induce responses that have desired properties, e.g., truthfulness, offering a promising approach for LLM alignment without the need for fine-tuning. Traditionally, steering has relied on supervision, such as from contrastive pairs of prompts that vary in a single target concept, which is costly to obtain and limits the speed of steering research. An appealing alternative is to use unsupervised approaches such as sparse autoencoders (SAEs) to map LLM embeddings to sparse representations that capture human-interpretable concepts. However, without further assumptions, SAEs may not be identifiable: they could learn latent dimensions that entangle multiple concepts, leading to unintentional steering of unrelated properties. We introduce Sparse Shift Autoencoders (SSAEs) that instead map the differences between embeddings to sparse representations. Crucially, we show that SSAEs are identifiable from paired observations that vary in multiple unknown concepts, leading to accurate steering of single concepts without the need for supervision. We empirically demonstrate accurate steering across semi-synthetic and real-world language datasets using Llama-3.1 embeddings.',
  },
  {
    id: 'mueller2025isolationentanglement',
    title: 'From Isolation to Entanglement: When Do Interpretability Methods Identify and Disentangle Known Concepts?',
    authors: 'Aaron Mueller, Andrew Lee, Shruti Joshi, Ekdeep Singh Lubana, Dhanya Sridhar, Patrik Reizinger',
    venue: 'arXiv preprint',
    year: 2025,
    tags: ['interpretability', 'causal-representation-learning', 'sparse-autoencoders', 'evaluation'],
    highlight: false,
    links: [
      { label: 'arXiv', href: 'https://arxiv.org/abs/2512.15134' },
    ],
    bibtex: `@misc{mueller2025isolationentanglementinterpretabilitymethods,
  title={From Isolation to Entanglement: When Do Interpretability Methods Identify and Disentangle Known Concepts?},
  author={Aaron Mueller and Andrew Lee and Shruti Joshi and Ekdeep Singh Lubana and Dhanya Sridhar and Patrik Reizinger},
  year={2025},
  eprint={2512.15134},
  archivePrefix={arXiv},
  primaryClass={cs.LG},
  url={https://arxiv.org/abs/2512.15134}
}`,
    abstract: 'A central goal of interpretability is to recover representations of causally relevant concepts from the activations of neural networks. The quality of these concept representations is typically evaluated in isolation, and under implicit independence assumptions that may not hold in practice. Thus, it is unclear whether common featurization methods - including sparse autoencoders (SAEs) and sparse probes - recover disentangled representations of these concepts. This study proposes a multi-concept evaluation setting where we control the correlations between textual concepts, such as sentiment, domain, and tense, and analyze performance under increasing correlations between them. We first evaluate the extent to which featurizers can learn disentangled representations of each concept under increasing correlational strengths. We observe a one-to-many relationship from concepts to features: features correspond to no more than one concept, but concepts are distributed across many features. Then, we perform steering experiments, measuring whether each concept is independently manipulable. Even when trained on uniform distributions of concepts, SAE features generally affect many concepts when steered, indicating that they are neither selective nor independent; nonetheless, features affect disjoint subspaces. These results suggest that correlational metrics for measuring disentanglement are generally not sufficient for establishing independence when steering, and that affecting disjoint subspaces is not sufficient for concept selectivity. These results underscore the importance of compositional evaluations in interpretability research.',
  },
  {
    id: 'trifinger-simulation',
    title: 'TriFinger Simulation',
    authors: 'Shruti Joshi, Felix Widmaier, Vaibhav Agrawal, Manuel Wüthrich',
    venue: 'GitHub',
    year: 2020,
    tags: ['software-package', 'robotics'],
    links: [
      { label: 'Code', href: 'https://github.com/open-dynamic-robot-initiative/trifinger_simulation' },
      { label: 'Paper', href: 'https://corlconf.github.io/corl2020/paper_421/' },
    ],
    bibtex: `@misc{trifinger-simulation,
  author = {Joshi, Shruti and Widmaier, Felix and Agrawal, Vaibhav and W{\\"u}thrich, Manuel},
  title = {TriFinger Simulation},
  year = {2020},
  publisher = {GitHub},
  journal = {GitHub repository},
  howpublished = {\\url{https://github.com/open-dynamic-robot-initiative/trifinger_simulation}}
}`,
    abstract: 'Official simulation package of the TriFinger robots.',
  },
  {
    id: 'gondal2021function',
    title: 'Function contrastive learning of transferable meta-representations',
    authors: 'Muhammad Waleed Gondal, Shruti Joshi, Nasim Rahaman, Stefan Bauer, Manuel Wüthrich, Bernhard Schölkopf',
    venue: 'ICML',
    year: 2021,
    tags: ['self-supervised-learning', 'generalisation', 'method'],
    links: [
      { label: 'Paper', href: 'https://proceedings.mlr.press/v139/gondal21a.html' },
    ],
    bibtex: `@inproceedings{gondal2021function,
  title={Function contrastive learning of transferable meta-representations},
  author={Gondal, Muhammad Waleed and Joshi, Shruti and Rahaman, Nasim and Bauer, Stefan and Wuthrich, Manuel and Sch{\\"o}lkopf, Bernhard},
  booktitle={International Conference on Machine Learning},
  pages={3755--3765},
  year={2021},
  organization={PMLR}
}`,
    abstract: 'Meta-learning algorithms adapt quickly to new tasks that are drawn from the same task distribution as the training tasks. The mechanism leading to fast adaptation is the conditioning of a downstream predictive model on the inferred representation of the task\'s underlying data generative process, or function. This meta-representation, which is computed from a few observed examples of the underlying function, is learned jointly with the predictive model. In this work, we study the implications of this joint training on the transferability of the meta-representations. Our goal is to learn meta-representations that are robust to noise in the data and facilitate solving a wide range of downstream tasks that share the same underlying functions. To this end, we propose a decoupled encoder-decoder approach to supervised meta-learning, where the encoder is trained with a contrastive objective to find a good representation of the underlying function. In particular, our training scheme is driven by the self-supervision signal indicating whether two sets of examples stem from the same function. Our experiments on a number of synthetic and real-world datasets show that the representations we obtain outperform strong baselines in terms of downstream performance and noise robustness, even when these baselines are trained in an end-to-end manner.',
  },
  {
    id: 'rahaman2021dynamic',
    title: 'Dynamic inference with neural interpreters',
    authors: 'Nasim Rahaman, Muhammad Waleed Gondal, Shruti Joshi, Peter Gehler, Yoshua Bengio, Francesco Locatello, Bernhard Schölkopf',
    venue: 'NeurIPS',
    year: 2021,
    tags: ['generalisation', 'method'],
    links: [
      { label: 'Paper', href: 'https://proceedings.neurips.cc/paper/2021/hash/5a7b238ba0f6502e5d6be14424b20ded-Abstract.html' },
    ],
    bibtex: `@article{rahaman2021dynamic,
  title={Dynamic inference with neural interpreters},
  author={Rahaman, Nasim and Gondal, Muhammad Waleed and Joshi, Shruti and Gehler, Peter and Bengio, Yoshua and Locatello, Francesco and Sch{\\"o}lkopf, Bernhard},
  journal={Advances in Neural Information Processing Systems},
  volume={34},
  pages={10985--10998},
  year={2021}
}`,
    abstract: 'Modern neural network architectures can leverage large amounts of data to generalize well within the training distribution. However, they are less capable of systematic generalization to data drawn from unseen but related distributions, a feat that is hypothesized to require compositional reasoning and reuse of knowledge. In this work, we present Neural Interpreters, an architecture that factorizes inference in a self-attention network as a system of modules, which we call functions. Inputs to the model are routed through a sequence of functions in a way that is end-to-end learned. The proposed architecture can flexibly compose computation along width and depth, and lends itself well to capacity extension after training. To demonstrate the versatility of Neural Interpreters, we evaluate it in two distinct settings: image classification and visual abstract reasoning on Raven Progressive Matrices. In the former, we show that Neural Interpreters perform on par with the vision transformer using fewer parameters, while being transferrable to a new task in a sample efficient manner. In the latter, we find that Neural Interpreters are competitive with respect to the state-of-the-art in terms of systematic generalization.',
  },
  {
    id: 'jain2022learning',
    title: 'Learning robust dynamics through variational sparse gating',
    authors: 'Arnav Kumar Jain, Shivakanth Sujit, Shruti Joshi, Vincent Michalski, Danijar Hafner, Samira Ebrahimi Kahou',
    venue: 'NeurIPS',
    year: 2022,
    tags: ['world-models', 'reinforcement-learning', 'method'],
    links: [
      { label: 'Paper', href: 'https://proceedings.neurips.cc/paper_files/paper/2022/hash/09b69d38e95d8c37bb870dde1fb7ed09-Abstract-Conference.html' },
    ],
    bibtex: `@article{jain2022learning,
  title={Learning robust dynamics through variational sparse gating},
  author={Jain, Arnav Kumar and Sujit, Shivakanth and Joshi, Shruti and Michalski, Vincent and Hafner, Danijar and Ebrahimi Kahou, Samira},
  journal={Advances in neural information processing systems},
  volume={35},
  pages={1612--1626},
  year={2022}
}`,
    abstract: 'Learning world models from their sensory inputs enables agents to plan for actions by imagining their future outcomes. World models have previously been shown to improve sample-efficiency in simulated environments with few objects, but have not yet been applied successfully to environments with many objects. In environments with many objects, often only a small number of them are moving or interacting at the same time. In this paper, we investigate integrating this inductive bias of sparse interactions into the latent dynamics of world models trained from pixels. First, we introduce Variational Sparse Gating (VSG), a latent dynamics model that updates its feature dimensions sparsely through stochastic binary gates. Moreover, we propose a simplified architecture Simple Variational Sparse Gating (SVSG) that removes the deterministic pathway of previous models, resulting in a fully stochastic transition function that leverages the VSG mechanism. We evaluate the two model architectures in the BringBackShapes (BBS) environment that features a large number of moving objects and partial observability, demonstrating clear improvements over prior models.',
  },
  {
    id: 'nutalapati2019online',
    title: 'Online utility-optimal trajectory design for time-varying ocean environments',
    authors: 'Mohan Krishna Nutalapati, Shruti Joshi, Ketan Rajawat',
    venue: 'ICRA',
    year: 2019,
    tags: ['robotics', 'convex-optimization', 'online-learning', 'method'],
    links: [
      { label: 'Paper', href: 'https://ieeexplore.ieee.org/document/8794161' },
    ],
    bibtex: `@inproceedings{nutalapati2019online,
  title={Online utility-optimal trajectory design for time-varying ocean environments},
  author={Nutalapati, Mohan Krishna and Joshi, Shruti and Rajawat, Ketan},
  booktitle={2019 International Conference on Robotics and Automation (ICRA)},
  pages={6853--6859},
  year={2019},
  organization={IEEE}
}`,
    abstract: 'This paper considers the problem of online optimal trajectory design under time-varying environments. Of particular interest is the design of energy-efficient trajectories under strong and uncertain disturbances in ocean environments and time-varying goal location. We formulate the problem within the constrained online convex optimization formalism, and a modified online gradient descent algorithm is motivated. The mobility constraints are met using a carefully chosen step-size, and the proposed algorithm is shown to incur sublinear regret. Different from the state-of-the-art algorithms that entail planning and re-planning the full trajectory using forecast data at each time instant, the proposed algorithm is entirely online and relies mostly on the current ocean velocity measurements at the vehicle locations. The trade-off between excess delay incurred in reaching the goal and the overall energy consumption is examined via numerical tests carried out on real data obtained from the regional ocean modelling system. As compared to the state-of-the-art algorithms, the proposed algorithm is not only energy-efficient but also several orders of magnitude computationally efficient.',
  },
];

export const allTags = [...new Set(publications.flatMap(p => p.tags))].sort();
