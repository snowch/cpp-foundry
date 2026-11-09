#include <algorithm>
#include <cmath>
#include <iostream>
#include <memory>
#include <utility>
#include <vector>

struct Node {
    int key, height = 1;
    std::unique_ptr<Node> left, right;
    explicit Node(int value) : key(value) {
    }
};
using Tree = std::unique_ptr<Node>;
int height(const Tree &node) {
    return node ? node->height : 0;
}
void update(Node &node) {
    node.height = 1 + std::max(height(node.left), height(node.right));
}
Tree left_rotate(Tree root) {
    auto raised = std::move(root->right);
    root->right = std::move(raised->left);
    update(*root);
    raised->left = std::move(root);
    update(*raised);
    return raised;
}
Tree right_rotate(Tree root) {
    auto raised = std::move(root->left);
    root->left = std::move(raised->right);
    update(*root);
    raised->right = std::move(root);
    update(*raised);
    return raised;
}
void balance(Tree &root) {
    if (!root)
        return;
    update(*root);
    if (height(root->left) - height(root->right) > 1) {
        if (height(root->left->right) > height(root->left->left))
            root->left = left_rotate(std::move(root->left));
        root = right_rotate(std::move(root));
    } else if (height(root->right) - height(root->left) > 1) {
        if (height(root->right->left) > height(root->right->right))
            root->right = right_rotate(std::move(root->right));
        root = left_rotate(std::move(root));
    }
}
void insert(Tree &root, int key) {
    if (!root) {
        root = std::make_unique<Node>(key);
        return;
    }
    if (key < root->key)
        insert(root->left, key);
    else if (key > root->key)
        insert(root->right, key);
    balance(root);
}
bool contains(const Tree &root, int key) {
    const Node *node = root.get();
    while (node) {
        if (key == node->key)
            return true;
        node = key < node->key ? node->left.get() : node->right.get();
    }
    return false;
}
void erase(Tree &root, int key) {
    if (!root)
        return;
    if (key < root->key)
        erase(root->left, key);
    else if (key > root->key)
        erase(root->right, key);
    else if (!root->left) {
        auto next = std::move(root->right);
        root = std::move(next);
    } else if (!root->right) {
        auto next = std::move(root->left);
        root = std::move(next);
    } else {
        const Node *next = root->right.get();
        while (next->left)
            next = next->left.get();
        root->key = next->key;
        erase(root->right, next->key);
    }
    balance(root);
}
void ordered(const Tree &root, std::vector<int> &result) {
    if (!root)
        return;
    ordered(root->left, result);
    result.push_back(root->key);
    ordered(root->right, result);
}
bool heights_valid(const Tree &root) {
    return !root ||
           (root->height == 1 + std::max(height(root->left), height(root->right)) &&
            std::abs(height(root->left) - height(root->right)) <= 1 &&
            heights_valid(root->left) && heights_valid(root->right));
}

int main() {
    Tree root;
    for (int key : {30, 10, 20})
        insert(root, key);
    std::cout << root->key << " left=" << root->left->key
              << " right=" << root->right->key << " valid=" << heights_valid(root)
              << "\n";
}
