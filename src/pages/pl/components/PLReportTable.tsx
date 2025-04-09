
        <TableCell className={`text-right ${fontClass}`}>
          {formatCurrency(actualAmount)}
          {percentageDisplay && (
            <span className="text-xs text-gray-500 ml-1">({percentageDisplay})</span>
          )}
        </TableCell>
