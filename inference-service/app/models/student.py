"""
Student model architectures.

These class definitions must match `BantayText_Refactored.ipynb` exactly
(notebook cells under Section 9.4 "SelfContainedStudentNN" and Section 10.1
"RawStudentNN") — any change to layer names, shapes, or ordering will break
loading of `best_distilled_student_model.pth` / `best_raw_student_model.pth`,
since PyTorch state dicts are matched by parameter name.
"""

import torch
import torch.nn as nn

STUDENT_EMBED_DIM = 128
STUDENT_HIDDEN_DIM = 128
NUM_CLASSES = 2


class SelfContainedStudentNN(nn.Module):
    """Knowledge-distilled student model (notebook Section 9.4)."""

    def __init__(
        self,
        vocab_size: int,
        embed_dim: int = STUDENT_EMBED_DIM,
        hidden_dim: int = STUDENT_HIDDEN_DIM,
        num_classes: int = NUM_CLASSES,
        max_length: int = 128,
    ):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.max_length = max_length
        self.network = nn.Sequential(
            nn.Linear(embed_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, num_classes),
        )

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor = None) -> torch.Tensor:
        token_embeddings = self.embedding(input_ids)
        if attention_mask is not None:
            expanded_mask = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
            masked_embeddings = token_embeddings * expanded_mask
            sum_of_embeddings = torch.sum(masked_embeddings, dim=1)
            token_count = torch.clamp(attention_mask.sum(dim=1, keepdim=True).float(), min=1e-9)
            pooled_representation = sum_of_embeddings / token_count
        else:
            pooled_representation = token_embeddings.mean(dim=1)
        return self.network(pooled_representation)


class RawStudentNN(nn.Module):
    """Non-distilled baseline student model (notebook Section 10.1)."""

    def __init__(
        self,
        vocab_size: int,
        embed_dim: int = STUDENT_EMBED_DIM,
        hidden_dim: int = STUDENT_HIDDEN_DIM,
        num_classes: int = NUM_CLASSES,
    ):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.network = nn.Sequential(
            nn.Linear(embed_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, num_classes),
        )

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        token_embeddings = self.embedding(input_ids)
        expanded_mask = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        masked_embeddings = token_embeddings * expanded_mask
        sum_of_embeddings = torch.sum(masked_embeddings, dim=1)
        token_count = torch.clamp(attention_mask.sum(dim=1, keepdim=True).float(), min=1e-9)
        pooled_representation = sum_of_embeddings / token_count
        return self.network(pooled_representation)
