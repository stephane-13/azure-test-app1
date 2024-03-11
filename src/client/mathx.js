/**
 * Math extra objects
 * @module Mathx
 */

'use strict'

import * as THREE from 'three';

/** 
 * @exports Mathx
 */
export { Mathx };

/**
 * @class Object used to handle extra mathematical objects
 */
class Mathx {

  /**
  * @constructor
  */
  constructor() {
  }

  /**
   * Function used row-reduced a matrix
  * @param {[number]} matrix        The matrix that will be row-reduced
  * @returns {[number]}       The resulting triangular matrix
  */
  reduceRows( matrix ) {

    let columns = matrix.length();  // This is the number of vectors
    let rows = matrix[0].rows();    // This is the dimension of the vectors
    let pivotRow = 0;
    let pivotCol = 0;

    // Loop until we reach the last column and row of the matrix
    while( pivotCol < columns && pivotRow < rows ) {

      // Find the first non-zero number below or at the current pivot
      let newPivotRow = -1;
      for( let row = pivotRow; row < rows; row++ ) {
        if( matrix[pivotCol][row] != 0 ) {
          newPivotRow = row;
          break;
        }
      }
      // If we didn't find any non-zero value in this column, move to the next column
      if( newPivotRow == -1 ) {
        pivotCol ++;
        continue;
      // If the first non-zero value is not the current pivot row, let's swap it
      } else if( newPivotRow > pivotRow ) {
        //for( )
      }


    //while h ≤ m and k ≤ n
    //    /* Find the k-th pivot: */
    //    i_max := argmax (i = h ... m, abs(A[i, k]))
    //    if A[i_max, k] = 0
    //        /* No pivot in this column, pass to next column */
    //        k := k+1
    //    else
    //         swap rows(h, i_max)
    //         /* Do for all rows below pivot: */
    //         for i = h + 1 ... m:
    //                f := A[i, k] / A[h, k]
    //                /* Fill with zeros the lower part of pivot column: */
    //                A[i, k] := 0
    //                /* Do for all remaining elements in current row: */
    //                for j = k + 1 ... n:
    //                     A[i, j] := A[i, j] - A[h, j] * f
    //         /* Increase pivot row and column */
    //         h := h + 1
    //         k := k + 1
    }
    return( matrix );
  }

  /**
   * Function used to solve a matrix
  * @param {[number]} matrix           The matrix that will be solved
  * @returns {[numbers]}               The resulting ceofficients
  */
  solveMatrix( matrix ) {
    let coefficients = [];
    return coefficients;
  }

}
