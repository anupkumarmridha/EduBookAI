class ItemService {
    constructor(private readonly itemModel: any) {}

    async fetchItems() {
        return await this.itemModel.find();
    }

    async addItem(itemData: any) {
        const newItem = new this.itemModel(itemData);
        return await newItem.save();
    }
}

export default ItemService;