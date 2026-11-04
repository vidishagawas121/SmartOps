import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

export const getNextSequenceValue = async (sequenceName: string): Promise<number> => {
  const CounterModel = mongoose.model<ICounter>('Counter', CounterSchema);
  const counter = await CounterModel.findOneAndUpdate(
    { id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

export default (mongoose.models.Counter as mongoose.Model<ICounter>) || mongoose.model<ICounter>('Counter', CounterSchema);
